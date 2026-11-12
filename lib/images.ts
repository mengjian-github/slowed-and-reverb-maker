import rawManifest from "./image-manifest.json";

// Written by scripts/optimize-images.mjs before `next build`. The checked-in
// default is empty so a build that skipped the prebuild step (or a dev server)
// still compiles and simply renders original images.
export type ImageVariant = { src: string; width: number; format: string };
export type ImageManifestEntry = { width: number; height: number; variants: ImageVariant[] };

const manifest = rawManifest as Record<string, ImageManifestEntry>;

export type DerivedImage = {
  width: number;
  height: number;
  sources: { type: string; srcSet: string }[];
};

export function imageDerivatives(src: string): DerivedImage | null {
  const entry = manifest[src];
  if (!entry || !entry.variants?.length) return null;
  const sources: { type: string; srcSet: string }[] = [];
  // avif first: browsers pick the first <source> whose type they support.
  for (const format of ["avif", "webp"]) {
    const variants = entry.variants
      .filter((variant) => variant.format === format)
      .sort((left, right) => left.width - right.width);
    if (!variants.length) continue;
    sources.push({
      type: `image/${format}`,
      srcSet: variants.map((variant) => `${variant.src} ${variant.width}w`).join(", "),
    });
  }
  if (!sources.length) return null;
  return { width: entry.width, height: entry.height, sources };
}
