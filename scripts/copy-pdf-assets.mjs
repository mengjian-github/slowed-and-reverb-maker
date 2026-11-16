import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Platform-owned build helper. Non-PDF sites do not ship these extra assets.
// Never follow a source-tree symlink or crawl a dependency/cache directory.
function importsPdf(directory) {
  if (!existsSync(directory)) return false;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink() || ["node_modules", ".git", ".next", "dist", "out"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory() && importsPdf(path)) return true;
    if (entry.isFile() && /\.(?:[cm]?js|jsx|ts|tsx)$/.test(entry.name) && readFileSync(path, "utf8").includes("pdfjs-dist")) return true;
  }
  return false;
}
const root = process.cwd();
if (["app", "components", "lib"].some(directory => importsPdf(join(root, directory)))) {
  const packageRoot = join(root, "node_modules", "pdfjs-dist");
  const pkg = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
  if (pkg.version !== "6.3.289") throw new Error("PDF engine version differs from the approved template");
  const target = join(root, "public", "pdfjs");
  const resources = ["cmaps", "standard_fonts", "wasm"];
  for (const name of resources) {
    const source = join(packageRoot, name);
    if (!statSync(source).isDirectory()) throw new Error(`Missing PDF engine resource directory: ${name}`);
  }
  mkdirSync(target, { recursive: true });
  for (const name of resources) cpSync(join(packageRoot, name), join(target, name), { recursive: true, force: true });
  writeFileSync(join(target, "engine-version.json"), JSON.stringify({ package: "pdfjs-dist", version: pkg.version, resources }));
  console.log(`PDF engine resources prepared from pdfjs-dist ${pkg.version}`);
} else {
  console.log("PDF engine resources skipped: no PDF.js imports in this site");
}
