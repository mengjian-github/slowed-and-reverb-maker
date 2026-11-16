#!/usr/bin/env node
// Generates responsive AVIF/WebP derivatives for the raster assets the engine
// copied into public/images, plus lib/image-manifest.json for the renderer.
// Runs as the site's prebuild step. Originals are never rewritten — og:image
// URLs and tech-seo reachability checks keep pointing at the exact bytes the
// engine shipped. Every failure is per-image and fail-open: a skipped image
// keeps its plain <img> rendering, because a missing derivative must never
// block a site build.
//
// Incremental: every `npm run build` in an engineer's working copy (each
// screenshot round, each build check, each try) re-encoded every image into
// six AVIF/WebP derivatives, 12 images about 6 s on a desktop and several
// times that on a shared runner. A derivative is a pure function of its
// source bytes and the settings below, so .cache/optimize-images.json keeps
// each source's digest and manifest entry; an unchanged source whose
// derivatives are all on disk is not encoded again. A fresh checkout has no
// cache and encodes everything, as before.
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";

const IMAGES_ROOT = join("public", "images");
const DERIVED_DIR = "derived";
const MANIFEST_PATH = join("lib", "image-manifest.json");
const CACHE_PATH = join(".cache", "optimize-images.json");
const SOURCE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);
// 480 covers small phones, 960 covers phone@2x and tablets, 1440 covers the
// 1200px desktop container at typical density. Never upscaled past the source.
const TARGET_WIDTHS = [480, 960, 1440];
const FORMATS = [
  { format: "avif", options: { quality: 55 } },
  { format: "webp", options: { quality: 78 } },
];

async function loadSharp() {
  try {
    return (await import("sharp")).default;
  } catch (error) {
    console.warn(`optimize-images: sharp unavailable, keeping original images (${error?.message ?? error})`);
    return null;
  }
}

async function collectSources(directory, relativePath, out) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const childRelative = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (!relativePath && entry.name === DERIVED_DIR) continue;
      await collectSources(join(directory, entry.name), childRelative, out);
    } else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      out.push(childRelative);
    }
  }
}

async function readCache(key) {
  try {
    const cache = JSON.parse(await readFile(CACHE_PATH, "utf8"));
    return cache && cache.key === key && cache.images && typeof cache.images === "object" ? cache.images : {};
  } catch {
    return {};
  }
}

async function allOnDisk(variants) {
  for (const variant of variants) {
    try {
      if (!(await stat(join("public", ...variant.src.replace(/^\/+/, "").split("/")))).isFile()) return false;
    } catch {
      return false;
    }
  }
  return true;
}

const sharp = await loadSharp();
const manifest = {};
let variantCount = 0;
let reused = 0;
const SETTINGS_KEY = JSON.stringify({ widths: TARGET_WIDTHS, formats: FORMATS });
const cached = sharp ? await readCache(SETTINGS_KEY) : {};
const nextCache = {};
if (sharp) {
  const sources = [];
  await collectSources(IMAGES_ROOT, "", sources);
  sources.sort((left, right) => left.localeCompare(right, "en"));
  for (const relativeSource of sources) {
    const publicSrc = `/images/${relativeSource}`;
    try {
      const sourceFile = join(IMAGES_ROOT, ...relativeSource.split("/"));
      const sha = createHash("sha256").update(await readFile(sourceFile)).digest("hex");
      const hit = cached[relativeSource];
      if (hit?.sha === sha && hit.entry?.variants?.length && await allOnDisk(hit.entry.variants)) {
        manifest[publicSrc] = hit.entry;
        nextCache[relativeSource] = hit;
        variantCount += hit.entry.variants.length;
        reused += 1;
        continue;
      }
      const metadata = await sharp(sourceFile).metadata();
      if (!metadata.width || !metadata.height) continue;
      // EXIF orientations 5-8 render sideways; derivatives are re-encoded via
      // rotate() (which drops EXIF), so the manifest must carry displayed dims.
      const sideways = (metadata.orientation ?? 1) >= 5;
      const displayWidth = sideways ? metadata.height : metadata.width;
      const displayHeight = sideways ? metadata.width : metadata.height;
      const widths = TARGET_WIDTHS.filter((width) => width <= displayWidth);
      if (!widths.length) widths.push(displayWidth);
      const strippedName = relativeSource.replace(/\.[^./]+$/, "");
      const variants = [];
      for (const { format, options } of FORMATS) {
        for (const width of widths) {
          const derivedRelative = `${DERIVED_DIR}/${strippedName}.w${width}.${format}`;
          const derivedFile = join(IMAGES_ROOT, ...derivedRelative.split("/"));
          await mkdir(dirname(derivedFile), { recursive: true });
          await sharp(sourceFile)
            .rotate()
            .resize({ width, withoutEnlargement: true })
            .toFormat(format, options)
            .toFile(derivedFile);
          variants.push({ src: `/images/${derivedRelative}`, width, format });
        }
      }
      manifest[publicSrc] = { width: displayWidth, height: displayHeight, variants };
      nextCache[relativeSource] = { sha, entry: manifest[publicSrc] };
      variantCount += variants.length;
    } catch (error) {
      console.warn(`optimize-images: skipped ${publicSrc}: ${error?.message ?? error}`);
    }
  }
}
const sorted = Object.fromEntries(
  Object.entries(manifest).sort(([left], [right]) => left.localeCompare(right, "en")),
);
await writeFile(MANIFEST_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
if (sharp) {
  try {
    await mkdir(dirname(CACHE_PATH), { recursive: true });
    await writeFile(CACHE_PATH, JSON.stringify({ key: SETTINGS_KEY, images: nextCache }));
  } catch (error) {
    console.warn(`optimize-images: cache not written (${error?.message ?? error})`);
  }
}
console.log(`optimize-images: ${Object.keys(sorted).length} images, ${variantCount} derivatives${reused ? ` (${reused} unchanged, not re-encoded)` : ""}`);
