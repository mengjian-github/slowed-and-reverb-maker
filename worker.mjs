// CSP script-src (CSP_SCRIPT_SRC wrangler var):
//   unset / anything else -> no script-src of either kind (the default). The
//                            enforced header still carries base-uri,
//                            object-src, frame-src, frame-ancestors and
//                            form-action on every response.
//   "enforce"             -> script-src joins the enforced header, by an
//                            explicit per-site decision.
// The default used to be Content-Security-Policy-Report-Only with no report
// endpoint: it enforced nothing, reported nowhere, and every browser logged a
// console error about it on every page, which the QA tester reported as the
// site's defect (Mashup Creator run_0a7bd2d5-2e9-infra-qa, 2026-11-14).
// Enforcing by default is not safe yet: the sites' ad and analytics tags load
// scripts the allowlist cannot foresee, and a blocked script is a broken tool
// or lost revenue that nothing on the page reports.
// The enforce allowlist comes from dist/__shipsite/csp.json (written by the
// postbuild generate-csp-manifest.mjs): per-route sha256 hashes for inline
// scripts plus the sanctioned external script hosts, with 'wasm-unsafe-eval'
// and blob: for the in-browser tools (WebAssembly decoders, blob-URL workers
// and audio worklets). A missing manifest or an unmapped route fails open: no
// script-src is sent for that response, with a console note so the gap is
// observable.
const cspManifestCache = new WeakMap();

function loadCspManifest(env, requestUrl) {
  let cached = cspManifestCache.get(env.ASSETS);
  if (!cached) {
    cached = env.ASSETS.fetch(new URL("/__shipsite/csp.json", requestUrl))
      .then(async (response) => {
        if (!response.ok) throw new Error(`status_${response.status}`);
        const manifest = await response.json();
        if (!manifest || typeof manifest !== "object" || typeof manifest.routes !== "object" || manifest.routes === null) {
          throw new Error("malformed_manifest");
        }
        return manifest;
      })
      .catch((error) => {
        console.warn(`csp-manifest-unavailable: withholding script-src (fail-open): ${error?.message ?? error}`);
        return null;
      });
    cspManifestCache.set(env.ASSETS, cached);
  }
  return cached;
}

// Request pathname -> manifest route key. Must stay behavior-identical to
// routeKeyForDistPath in scripts/generate-csp-manifest.mjs.
export function cspRouteKey(pathname) {
  let path = pathname;
  if (path.endsWith("/index.html")) path = path.slice(0, -"/index.html".length);
  else if (path.endsWith(".html")) path = path.slice(0, -".html".length);
  while (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path === "" ? "/" : path;
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    // The assets layer answers a miss (404) with no Content-Type header at
    // all. Paired with the nosniff header this worker always sets, firefox
    // reports any such script/style miss as `blocked due to MIME type ("")
    // mismatch` — which reads like a serving bug and buried a propagation
    // 404 behind a MIME mystery (run_2873ca24-9c0-infra, 2026-08-12). A body
    // without a declared type is served as plain text, so the block message
    // names an honest type and the 404 stays diagnosable as a 404.
    if (!headers.has("Content-Type")) headers.set("Content-Type", "text/plain; charset=utf-8");
    const preview = env.SHIPSITE_ENVIRONMENT === "preview";
    headers.set("Content-Security-Policy", `base-uri 'self'; object-src 'none'; frame-src 'self' https://www.youtube-nocookie.com; frame-ancestors ${preview ? "https://shipsite.ai https://www.shipsite.ai" : "'none'"}; form-action 'self' https://accounts.google.com https://connect.stripe.com`);
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    headers.set("X-Content-Type-Options", "nosniff");
    if (!preview) headers.set("X-Frame-Options", "DENY");
    else headers.delete("X-Frame-Options");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("Permissions-Policy", "camera=(), microphone=(self), geolocation=()");
    if (env.CF_VERSION_METADATA?.id) headers.set("X-Shipsite-Worker-Version", env.CF_VERSION_METADATA.id);
    const enforceScriptSrc = String(env.CSP_SCRIPT_SRC ?? "").toLowerCase() === "enforce";
    if (enforceScriptSrc && (headers.get("Content-Type") ?? "").toLowerCase().includes("text/html")) {
      const manifest = await loadCspManifest(env, request.url);
      // Unknown paths serve the exported 404 page, so its hashes are the
      // right ones for every 404 response regardless of the requested path.
      const routeKey = response.status === 404 ? "/404" : cspRouteKey(new URL(request.url).pathname);
      const hashes = manifest?.routes?.[routeKey];
      if (Array.isArray(hashes)) {
        const hosts = Array.isArray(manifest.hosts) ? manifest.hosts : [];
        const scriptSrc = ["script-src 'self' 'wasm-unsafe-eval' blob:", ...hosts, ...hashes.map((hash) => `'${hash}'`)].join(" ");
        headers.set("Content-Security-Policy", `${headers.get("Content-Security-Policy")}; ${scriptSrc}; worker-src 'self' blob:`);
      } else if (manifest) {
        console.warn(`csp-route-unmapped:${routeKey} — withholding script-src (fail-open)`);
      }
    }
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
