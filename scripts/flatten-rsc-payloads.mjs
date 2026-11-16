// Next's client router asks a static host for a page's prefetch payloads by
// flat names in the page's folder: /guide/__next.guide.__PAGE__.txt (the
// segment path with every "/" turned into "."). `next build` with
// output: "export" writes them under those names on Linux, but on Windows it
// joins the segment path with "\" and writes guide/__next.guide/__PAGE__.txt
// instead, so every link prefetch of a site built on a Windows computer 404s on
// the deployed site (Beat Maker maker run, 2026-11-13). This step moves each
// file under a `__next.*` folder to the flat name the client requests. A build
// that already wrote flat names has no such folders, so it changes nothing.
import { existsSync, readdirSync, renameSync, rmdirSync, statSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

/** Moves every nested segment payload in `distDir` to its flat name; returns the names moved to. */
export function flattenRscPayloads(distDir = "dist") {
  const moved = [];
  const flatten = (folder, parent, prefix) => {
    for (const name of readdirSync(folder)) {
      const entry = join(folder, name);
      if (statSync(entry).isDirectory()) flatten(entry, parent, `${prefix}.${name}`);
      else {
        renameSync(entry, join(parent, `${prefix}.${name}`));
        moved.push(`${prefix}.${name}`);
      }
    }
    rmdirSync(folder);
  };
  const walk = (folder) => {
    for (const name of readdirSync(folder)) {
      const entry = join(folder, name);
      if (!statSync(entry).isDirectory()) continue;
      if (name.startsWith("__next.")) flatten(entry, folder, name);
      else if (!(folder === distDir && name === "_next")) walk(entry);
    }
  };
  if (existsSync(distDir)) walk(distDir);
  return moved;
}

if (process.argv[1] && /flatten-rsc-payloads\.mjs$/.test(process.argv[1])) {
  const moved = flattenRscPayloads(process.argv[2] ?? "dist");
  console.log(`flatten-rsc-payloads: ${moved.length} prefetch payload${moved.length === 1 ? "" : "s"} moved to the names the router requests`);
}
