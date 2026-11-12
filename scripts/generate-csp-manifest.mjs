#!/usr/bin/env node
// Builds the CSP script-src manifest for a generated site: scans every
// dist/**/*.html the static export produced, hashes the exact bytes of each
// EXECUTABLE inline <script> (sha256, the form CSP consumes), and writes
// dist/__shipsite/csp.json mapping route path -> hash list plus the sanctioned
// external script host allowlist (derived from scripts/csp-script-hosts.mjs —
// the shared single source of truth the QA gate also reads — plus the
// owner-configured ad zone loader origin from lib/site-config.json).
//
// Runs as the site's postbuild step so the manifest always exists inside the
// same immutable dist the deploy workflow fingerprints and reuse_dist
// promotes. Output is deterministic (sorted keys, no timestamps) so rebuilding
// the same inputs yields byte-identical dist manifests.
//
// Non-executable data blocks (application/ld+json, application/json, …) are
// NOT hashed: CSP script-src does not govern them.
//
// Failure posture is fail-open end to end: any error here logs and exits 0
// with no manifest written, and the worker responds to a missing manifest by
// withholding script-src entirely — a broken generator must never block a
// site build or break a served page.
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const CSP_MANIFEST_CONTRACT = "shipsite.csp-script-src-manifest.v1";
export const CSP_MANIFEST_DIST_PATH = "__shipsite/csp.json";

// A <script> with no type (or an empty one) executes as classic JS; module
// and importmap blocks are script-src-governed too. Everything else —
// ld+json structured data, application/json payloads, text/template — is
// inert data and never needs a hash.
const EXECUTABLE_SCRIPT_TYPES = new Set(["", "module", "importmap", "text/javascript", "application/javascript"]);

// The exact text content of every executable inline script in `html`, in
// document order. External (src=) scripts are covered by the host allowlist,
// not by hashes. The regex ends a script at the first `</script>` — the same
// place an HTML parser ends it — so the captured bytes are exactly what the
// browser will hash when it checks the CSP.
export function executableInlineScripts(html) {
  const out = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = match[1] ?? "";
    if (/\bsrc\s*=/i.test(attrs)) continue;
    const typeMatch = attrs.match(/\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const type = (typeMatch ? (typeMatch[1] ?? typeMatch[2] ?? typeMatch[3] ?? "") : "").trim().toLowerCase();
    if (!EXECUTABLE_SCRIPT_TYPES.has(type)) continue;
    out.push(match[2]);
  }
  return out;
}

// CSP source expression for one inline script: sha256 over the exact UTF-8
// bytes of the element's text content, base64-encoded.
export function inlineScriptHash(source) {
  return `sha256-${createHash("sha256").update(source, "utf8").digest("base64")}`;
}

// dist-relative HTML path (posix separators) -> the route key the worker
// looks up. Must stay behavior-identical to cspRouteKey in worker.mjs:
//   index.html        -> /
//   about/index.html  -> /about
//   about.html        -> /about
//   404.html          -> /404
export function routeKeyForDistPath(relativePath) {
  let path = `/${relativePath}`;
  if (path.endsWith("/index.html")) path = path.slice(0, -"/index.html".length);
  else if (path.endsWith(".html")) path = path.slice(0, -".html".length);
  while (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path === "" ? "/" : path;
}

async function collectHtmlFiles(directory, relativePath, out) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const childRelative = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) await collectHtmlFiles(join(directory, entry.name), childRelative, out);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) out.push(childRelative);
  }
}

export async function buildCspManifest(distRoot, siteConfig, hostsFor) {
  const htmlFiles = [];
  await collectHtmlFiles(distRoot, "", htmlFiles);
  htmlFiles.sort((left, right) => left.localeCompare(right, "en"));
  const routes = {};
  for (const relative of htmlFiles) {
    const html = await readFile(join(distRoot, ...relative.split("/")), "utf8");
    const key = routeKeyForDistPath(relative);
    // about.html and about/index.html both map to /about: union the hashes so
    // whichever file the asset router serves is covered.
    const hashes = new Set(routes[key] ?? []);
    for (const source of executableInlineScripts(html)) hashes.add(inlineScriptHash(source));
    routes[key] = [...hashes].sort((left, right) => left.localeCompare(right, "en"));
  }
  const sortedRoutes = Object.fromEntries(
    Object.entries(routes).sort(([left], [right]) => left.localeCompare(right, "en")),
  );
  return { contract: CSP_MANIFEST_CONTRACT, hosts: hostsFor(siteConfig), routes: sortedRoutes };
}

async function main() {
  const distRoot = process.argv[2] ?? "dist";
  // Shipped alongside this script in every generated site; the template
  // manifest sources it from the repo's shared/csp-script-hosts.mjs, so the
  // allowlist here is the same one the engine QA gate sanctions. Dynamic
  // import keeps the pure functions above importable from the source repo,
  // where the sibling copy does not exist.
  const { cspScriptSrcHosts } = await import(new URL("./csp-script-hosts.mjs", import.meta.url));
  let siteConfig = null;
  try {
    siteConfig = JSON.parse(await readFile(join("lib", "site-config.json"), "utf8"));
  } catch {
    // No readable site config: the static allowlist still applies.
  }
  const manifest = await buildCspManifest(distRoot, siteConfig, cspScriptSrcHosts);
  const outFile = join(distRoot, ...CSP_MANIFEST_DIST_PATH.split("/"));
  await mkdir(join(distRoot, "__shipsite"), { recursive: true });
  await writeFile(outFile, `${JSON.stringify(manifest, null, 2)}\n`);
  const hashCount = Object.values(manifest.routes).reduce((total, hashes) => total + hashes.length, 0);
  console.log(`generate-csp-manifest: ${Object.keys(manifest.routes).length} routes, ${hashCount} inline script hashes, ${manifest.hosts.length} hosts`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main();
  } catch (error) {
    // Fail-open: the worker withholds script-src when the manifest is absent,
    // so a generator failure degrades to today's behavior instead of blocking
    // the build or breaking the served site.
    console.warn(`generate-csp-manifest: skipped (${error?.message ?? error}) — worker will withhold script-src (fail-open)`);
  }
}
