#!/usr/bin/env node
// Generates responsive AVIF/WebP derivatives for the raster assets the engine
// copied into public/images, plus lib/image-manifest.json for the renderer.
// Runs as the site's prebuild step. Originals are never rewritten — og:image
// URLs and tech-seo reachability checks keep pointing at the exact bytes the
// engine shipped. Every failure is per-image and fail-open: a skipped image
// keeps its plain <img> rendering, because a missing derivative must never
// block a site build.
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";

const IMAGES_ROOT = join("public", "images");
const DERIVED_DIR = "derived";
const MANIFEST_PATH = join("lib", "image-manifest.json");
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

const sharp = await loadSharp();
const manifest = {};
let variantCount = 0;
if (sharp) {
  const sources = [];
  await collectSources(IMAGES_ROOT, "", sources);
  sources.sort((left, right) => left.localeCompare(right, "en"));
  for (const relativeSource of sources) {
    const publicSrc = `/images/${relativeSource}`;
    try {
      const sourceFile = join(IMAGES_ROOT, ...relativeSource.split("/"));
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
console.log(`optimize-images: ${Object.keys(sorted).length} images, ${variantCount} derivatives`);
