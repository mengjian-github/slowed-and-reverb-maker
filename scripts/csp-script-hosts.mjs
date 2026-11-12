// Single source of truth for the script hosts a generated site may load.
//
// Two consumers, one list — they must never drift:
//   - engine/src/qa.ts builds its "no external dependencies" sanction regex
//     from SANCTIONED_SCRIPT_URL_PREFIXES (exact URL prefixes, strict gate).
//   - templates/site/scripts/generate-csp-manifest.mjs derives the script-src
//     host allowlist for dist/__shipsite/csp.json from cspScriptSrcHosts()
//     (host-level, deliberately wider — see below).
//
// The template copy ships into every generated site as
// scripts/csp-script-hosts.mjs via the template manifest, whose source entry
// points at THIS file — there is no second copy to keep in sync.
//
// Plain .mjs on purpose: the generated site's postbuild step runs it under
// bare node with no TypeScript toolchain. Types live in the sibling
// csp-script-hosts.d.mts declaration.
//
// This module never special-cases a project, keyword, or vertical.

// The exact script URL prefixes the QA self-containment gate sanctions.
// Order matters for the regex alternation: www.shipsite.ai before shipsite.ai
// keeps the historical first-match behavior.
// shipsite.ai is not here: a generated site loads nothing from the platform
// that built it (owner rule 2026-11-12); its runtime is its own
// /__shipsite/runtime.js.
export const SANCTIONED_SCRIPT_URL_PREFIXES = Object.freeze([
  "https://www.googletagmanager.com/gtag/js",
  "https://www.clarity.ms/tag/",
  "https://plausible.io/js/script.js",
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
]);

// Host-level widening for the CSP script-src allowlist only. The QA gate
// stays strict (exact prefixes above); CSP runs in report-only observation
// where a false block would cost analytics/ads revenue, so the analytics and
// advertising families are allowed wholesale: gtag chains into
// google-analytics.com, and AdSense fans out across the googlesyndication /
// doubleclick / adtrafficquality domain families at Google's discretion.
// When in doubt a host goes ON this list — data reporting must never be
// impaired by CSP.
export const CSP_EXTRA_SCRIPT_HOSTS = Object.freeze([
  "https://*.google-analytics.com",
  "https://www.google-analytics.com",
  "https://*.googletagmanager.com",
  "https://*.googlesyndication.com",
  "https://*.doubleclick.net",
  "https://www.googleadservices.com",
  "https://adservice.google.com",
  "https://*.adtrafficquality.google",
  "https://fundingchoicesmessages.google.com",
  "https://*.clarity.ms",
]);

/**
 * The script-src host allowlist for one generated site: the origins of every
 * sanctioned URL prefix, the wide analytics/ads family, plus the origin of
 * any owner-configured rotating-domain ad zone loader (Adsterra/Monetag)
 * found in the site config. Deterministic (sorted, deduplicated) so the
 * emitted csp.json is byte-stable across rebuilds of the same inputs.
 * @param {{ ads?: { scriptUrl?: string } | null, analyticsTags?: { plausible?: { src?: string } | null } | null } | null | undefined} siteConfig
 * @returns {string[]}
 */
export function cspScriptSrcHosts(siteConfig) {
  const hosts = new Set(CSP_EXTRA_SCRIPT_HOSTS);
  for (const prefix of SANCTIONED_SCRIPT_URL_PREFIXES) {
    try {
      hosts.add(new URL(prefix).origin);
    } catch {
      // A malformed prefix must never break manifest generation.
    }
  }
  // The platform's self-hosted Plausible the build points the site at.
  const plausibleSrc = siteConfig?.analyticsTags?.plausible?.src;
  if (typeof plausibleSrc === "string" && plausibleSrc) {
    try {
      const origin = new URL(plausibleSrc).origin;
      if (origin.startsWith("https://")) hosts.add(origin);
    } catch {
      // An unparseable address simply contributes no host.
    }
  }
  const zoneScriptUrl = siteConfig?.ads?.scriptUrl;
  if (typeof zoneScriptUrl === "string" && zoneScriptUrl) {
    try {
      const origin = new URL(zoneScriptUrl).origin;
      if (origin.startsWith("https://")) hosts.add(origin);
    } catch {
      // An unparseable owner-configured URL simply contributes no host.
    }
  }
  return [...hosts].sort((left, right) => left.localeCompare(right, "en"));
}
