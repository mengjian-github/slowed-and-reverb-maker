import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { join } from "node:path";

const fail = (code) => { console.error(`shipsite_return_failed:${code}`); process.exit(1); };
const required = (name) => { const value = process.env[name]; if (!value) fail(`env_missing:${name}`); return value; };

const projectId = required("SHIPSITE_PROJECT_ID");
const sourceSha256 = required("SHIPSITE_SOURCE_SHA256");
const requestUrl = required("ACTIONS_ID_TOKEN_REQUEST_URL");
const requestToken = required("ACTIONS_ID_TOKEN_REQUEST_TOKEN");
const callbackBase = (process.env.SHIPSITE_CALLBACK_BASE_URL || "https://shipsite.ai").replace(/\/+$/, "");
// What ShipSite takes (app/lib/owner-build-complete.ts MAX_OWNER_ARTIFACT_BYTES,
// MAX_OWNER_DIST_DECODED_BYTES, MAX_OWNER_DIST_FILES; owner-cloudflare-deploy.ts
// OWNER_ASSET_FILE_MAX_BYTES, OWNER_DIST_MAX_TOTAL_FILES), the limits Shipsite
// Link checks too. Checked before a byte goes to Cloudflare or ShipSite.
const LIMITS = { packedBytes: 48_000_000, unpackedBytes: 96_000_000, packageFiles: 2_048, fileBytes: 25 * 1024 * 1024, totalFiles: 20_000 };
const megabytes = (bytes) => `${(bytes / 1_000_000).toFixed(1)} MB`;
const PACKAGE_ADVICE = "Pages, scripts and JSON (.html, .js, .mjs, .json, .txt, .xml) travel together in one package of at most 48.0 MB packed and 96.0 MB unpacked, so large data belongs in a binary file (a model, .wasm, .bin, media), which goes to Cloudflare on its own. A file over 25 MiB is either split into parts of at most 25 MiB that the page joins, or fetch()ed at run time from its own host at a pinned version (a Hugging Face resolve URL or a GitHub release that answers with Access-Control-Allow-Origin, checked against a pinned sha256).";
// The built site's to change (owner-build-failure.ts reads the code), not a return to retry.
const tooLarge = (problems, named) => fail(`deploy_package_too_large: the built site cannot be deployed: ${problems.join("; ")}. Largest files: ${[...named].sort((a, b) => b.bytes - a.bytes).slice(0, 8).map((file) => `${file.path} ${megabytes(file.bytes)}`).join(", ")}. ${PACKAGE_ADVICE}`);

for (const path of ["dist", "worker.mjs", "wrangler.toml"]) {
  if (!existsSync(path)) fail(`build_output_missing:${path}`);
}

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");
const stage = ".shipsite-package";
rmSync(stage, { recursive: true, force: true });
rmSync("shipsite-dist.zip", { force: true });
mkdirSync(stage, { recursive: true });
cpSync("dist", join(stage, "dist"), { recursive: true });
// worker.mjs ships as the Worker's only module. One that imports its own
// modules or packages is bundled the way wrangler bundles it (the link's
// WORKER_BUNDLE_FLAGS and the backend smoke run it the same way); a
// single-module worker.mjs ships byte for byte.
const RUNTIME_SPECIFIER = /^(?:node|cloudflare|workerd):/;
const BUILTIN_NAMES = new Set(builtinModules);
const MODULE_SPECIFIERS = /(?:^|[;}\n])\s*(?:import\s*(?:[\w$*{][^;]*?\bfrom\s*)?|export\s*[\w$*{][^;]*?\bfrom\s*)["']([^"'\n]+)["']|\bimport\s*\(\s*["']([^"'\n]+)["']\s*\)/g;
const workerImportsModules = (source) => {
  for (const match of source.matchAll(MODULE_SPECIFIERS)) {
    const spec = match[1] ?? match[2];
    if (!RUNTIME_SPECIFIER.test(spec) && !BUILTIN_NAMES.has(spec)) return true;
  }
  return false;
};
if (workerImportsModules(readFileSync("worker.mjs", "utf8"))) {
  const externals = ["cloudflare:*", "workerd:*", "node:*", ...builtinModules.filter((name) => !name.startsWith("_"))].map((name) => `--external:${name}`);
  try {
    execFileSync("npx", ["--yes", "esbuild", "worker.mjs", "--bundle", "--format=esm", "--target=es2022", "--platform=neutral", "--main-fields=browser,module,main", "--conditions=workerd,worker,browser", ...externals, `--outfile=${join(stage, "worker.mjs")}`], { stdio: "inherit" });
  } catch {
    fail("worker_bundle_failed");
  }
} else {
  cpSync("worker.mjs", join(stage, "worker.mjs"));
}
cpSync("wrangler.toml", join(stage, "wrangler.toml"));

// Workflow v9 (manifest v2): pages, scripts and data files the production
// projection rewrites travel in the ZIP with worker.mjs and wrangler.toml;
// every other file under dist/ (models, wasm, images, fonts, media, CSS) goes
// straight to the owner's Cloudflare through upload sessions ShipSite opens
// with the owner's grant (app/lib/owner-direct-upload.ts), and the manifest
// lists it as carrier "direct". The same pattern as Shipsite Link's
// travelsInPackage; ShipSite refuses a direct file that matches it.
const PACKAGE_TEXT = /\.(?:html?|txt|rsc|xml|json|webmanifest|js|mjs|cjs)$/i;
const travelsInPackage = (path) => path === "worker.mjs" || path === "wrangler.toml" || PACKAGE_TEXT.test(path);
const files = [];
const direct = [];
const walk = (directory, prefix) => {
  for (const entry of readdirSync(directory).sort()) {
    const full = join(directory, entry);
    const relative = prefix ? `${prefix}/${entry}` : entry;
    const kind = lstatSync(full);
    if (kind.isDirectory()) { walk(full, relative); continue; }
    // Files only, as Shipsite Link packs: a symbolic link the build left in
    // dist/ would carry whatever this runner can read into a public deploy.
    if (!kind.isFile()) fail(`pack_refused: ${relative} is not a regular file (a deploy carries files only)`);
    const body = readFileSync(full);
    const file = { path: relative, sha256: sha256(body), bytes: body.byteLength };
    if (travelsInPackage(relative)) { files.push(file); continue; }
    files.push({ ...file, carrier: "direct" });
    direct.push(file);
  }
};
walk(stage, "");
const packaged = files.filter((file) => file.carrier !== "direct");
const unpacked = packaged.reduce((sum, file) => sum + file.bytes, 0);
const oversize = files.filter((file) => file.bytes > LIMITS.fileBytes);
const problems = [];
if (oversize.length) problems.push(`${oversize.length} file${oversize.length === 1 ? "" : "s"} over Cloudflare's 25 MiB limit for one static file`);
if (files.length > LIMITS.totalFiles) problems.push(`${files.length} files (Cloudflare serves at most ${LIMITS.totalFiles} in one Worker version)`);
if (packaged.length > LIMITS.packageFiles) problems.push(`${packaged.length} pages, scripts and data files (the package holds at most ${LIMITS.packageFiles})`);
if (unpacked > LIMITS.unpackedBytes) problems.push(`${megabytes(unpacked)} of pages, scripts and data files unpacked (at most ${megabytes(LIMITS.unpackedBytes)})`);
if (problems.length) tooLarge(problems, oversize.length ? oversize : unpacked > LIMITS.unpackedBytes || packaged.length > LIMITS.packageFiles ? packaged : files);
// Their copies stay at the same paths outside the package, read again when they are uploaded.
for (const file of direct) rmSync(join(stage, file.path));
writeFileSync(join(stage, "manifest.json"), `${JSON.stringify({ contract: "shipsite.owner-dist-manifest.v2", files }, null, 2)}\n`);
// The signed manifest describes files, not directory markers. Keep the
// receiver's exact-set check strict by emitting a file-only ZIP.
execFileSync("zip", ["-q", "-r", "-D", "../shipsite-dist.zip", "."], { cwd: stage });

const artifact = readFileSync("shipsite-dist.zip");
// Before the binary files go to Cloudflare: a ZIP ShipSite would refuse sends nothing.
if (artifact.byteLength > LIMITS.packedBytes) tooLarge([`${megabytes(artifact.byteLength)} packed (at most ${megabytes(LIMITS.packedBytes)})`], packaged);
const artifactSha256 = sha256(artifact);

const mintOidcToken = async () => {
  const oidcResponse = await fetch(`${requestUrl}&audience=${encodeURIComponent("https://shipsite.ai")}`, {
    headers: { authorization: `bearer ${requestToken}` },
  });
  if (!oidcResponse.ok) fail(`oidc_request_${oidcResponse.status}`);
  const { value } = await oidcResponse.json();
  if (!value) fail("oidc_token_missing");
  return value;
};
const identityHeaders = () => ({
  "x-shipsite-contract": "shipsite.owner-build.v1",
  "x-shipsite-repository-id": required("GITHUB_REPOSITORY_ID"),
  "x-shipsite-run-id": required("GITHUB_RUN_ID"),
  "x-shipsite-run-attempt": required("GITHUB_RUN_ATTEMPT"),
  "x-shipsite-head-sha": required("GITHUB_SHA"),
  "x-shipsite-source-sha256": sourceSha256,
});

// A server error, a 429 or a dropped connection is asked again (5 s, then
// 20 s); a refusal (4xx) is final.
const RETRY_DELAYS_MS = (process.env.SHIPSITE_RETURN_RETRY_DELAYS_MS || "5000,20000").split(",").map(Number).filter((ms) => Number.isFinite(ms) && ms >= 0).slice(0, 4);
const send = async (call, label) => {
  let response = null;
  let transportError = "";
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    if (attempt) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1]));
    try {
      response = await call();
      transportError = "";
    } catch (error) {
      response = null;
      transportError = String(error?.message ?? error).slice(0, 200);
    }
    if (response && response.status < 500 && response.status !== 429) break;
    if (attempt < RETRY_DELAYS_MS.length) console.log(`shipsite ${label}: ${response ? `HTTP ${response.status}` : transportError}; trying again`);
  }
  if (!response) fail(`${label}_transport:${transportError}`);
  if (!response.ok) fail(`${label}_${response.status}:${(await response.text()).slice(0, 200)}`);
  return response;
};

if (direct.length) {
  const directToken = await mintOidcToken();
  const session = await send(() => fetch(`${callbackBase}/api/internal/owner-builds/${encodeURIComponent(projectId)}/direct`, {
    method: "POST",
    headers: { authorization: `Bearer ${directToken}`, "content-type": "application/json", ...identityHeaders() },
    body: JSON.stringify({ files: direct }),
  }), "direct_session");
  const answer = await session.json().catch(() => null);
  if (answer?.contract !== "shipsite.owner-direct-upload.v1" || !Array.isArray(answer.targets) || typeof answer.uploadUrl !== "string"
    || !answer.uploadUrl.startsWith("https://api.cloudflare.com/") || !answer.files) fail("direct_session_unreadable");
  const listed = new Map(direct.map((file) => [file.path, file]));
  let uploaded = 0;
  for (const target of answer.targets) {
    for (const bucket of target.buckets ?? []) {
      const form = new FormData();
      for (const hash of bucket) {
        const named = answer.files[hash];
        const file = named ? listed.get(named.path) : null;
        if (!file) fail(`direct_unlisted_file:${named?.path ?? hash}`);
        const body = readFileSync(file.path);
        if (sha256(body) !== file.sha256) fail(`direct_file_changed:${file.path}`);
        form.append(hash, new Blob([body.toString("base64")], { type: named.contentType || "application/octet-stream" }));
        uploaded += 1;
      }
      await send(() => fetch(answer.uploadUrl, { method: "POST", headers: { authorization: `Bearer ${target.jwt}` }, body: form }), `cloudflare_${target.environment}`);
    }
  }
  console.log(`shipsite direct upload: ${direct.length} files, ${uploaded} sent to Cloudflare`);
}

const oidcToken = await mintOidcToken();
// The ZIP is the request body; what identifies it rides in headers. ShipSite
// reads it once into the bytes it verifies and stores (a base64 JSON envelope
// held it several times over in one 128 MB Worker). The OIDC token outlives the waits.
await send(() => fetch(`${callbackBase}/api/internal/owner-builds/${encodeURIComponent(projectId)}/complete`, {
  method: "POST",
  headers: {
    authorization: `Bearer ${oidcToken}`,
    "content-type": "application/zip",
    ...identityHeaders(),
    "x-shipsite-artifact-sha256": artifactSha256,
  },
  body: artifact,
}), "callback");
console.log(`shipsite owner build returned: artifact=${artifactSha256}`);
