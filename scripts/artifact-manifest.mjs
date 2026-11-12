#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";

const CONTRACT = "shipsite.canonical-file-manifest.v1";
const TYPES = new Map([
  [".css", "text/css"], [".html", "text/html"], [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"], [".jpg", "image/jpeg"], [".js", "text/javascript"],
  [".json", "application/json"], [".map", "application/json"], [".png", "image/png"],
  [".svg", "image/svg+xml"], [".txt", "text/plain"], [".webmanifest", "application/manifest+json"],
  [".xml", "application/xml"], [".woff", "font/woff"], [".woff2", "font/woff2"],
]);

const root = resolve(process.argv[2] ?? "dist");
const output = process.argv[3] ? resolve(process.argv[3]) : null;
const paths = [];
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.isFile()) paths.push(path);
  }
}
await walk(root);
paths.sort((left, right) => left.localeCompare(right, "en"));
const files = [];
for (const path of paths) {
  const body = await readFile(path);
  const normalized = relative(root, path).split(sep).join("/");
  if (!normalized || normalized.startsWith("../") || normalized.includes("/../")) throw new Error(`invalid_manifest_path:${normalized}`);
  files.push({
    path: normalized,
    contentType: TYPES.get(extname(normalized).toLowerCase()) ?? "application/octet-stream",
    bytes: body.byteLength,
    sha256: createHash("sha256").update(body).digest("hex"),
  });
}
const canonical = JSON.stringify({ contract: CONTRACT, files });
if (output) await writeFile(output, canonical);
process.stdout.write(`${createHash("sha256").update(canonical).digest("hex")}\n`);
