// The content data plane's CLIENT-SAFE half: types plus pure helpers, and not
// one server-only import in the module graph.
//
// This file is reachable from authored "use client" components by
// construction — the native authoring instruction hands the agent
// `import { resolveHref } from "../../lib/content"` as the sanctioned way to
// build hrefs — so anything with a Node dependency in here becomes a build
// failure on EVERY interactive route component at once. Live evidence
// (2026-08-13, prj_464d82e0-ccd): `loadPageContent` used to sit below these
// types with a top-level `import { promises as fs } from "fs"`, and the
// generated site failed the build gate round after round with
// `./lib/content.ts [Client Component Browser]` at the head of the import
// trace, naming a different components/native/*.tsx each round.
//
// The filesystem loader now lives in ./content-loader, which only ever runs
// during `next build` inside a Server Component. Keep this module free of
// "fs", "path", next/headers, next/server and server-only — the JS admission
// gate (shared/js-admission.ts) enforces the same boundary on authored code.
import type { Route, SiteConfig } from "./site-config";
// slug → the icon file the build emitted (a generated mark or a planned icon).
import entityMarks from "./entity-marks.json";

// Native pages type `route` from this module because the authoring contract
// names `@/lib/content` as the sanctioned import. Re-export Route so
// `import type { PageCta, PageImage, Route } from "@/lib/content"` compiles
// (The Sinking City 2 site-deploy, 2026-08-18: TS2614 Route not exported).
// SiteConfig too: a native page types `config` beside `route`, and Starter
// Feeding's home spent its first authoring attempt importing it from here
// (2026-10-28), so the page's last attempt kept a plain <select>.
export type { Route, SiteConfig };

export type PageCta = {
  label: string;
  href: string;
  primary?: boolean;
  action?: "link" | "google_login" | "checkout";
  product?: string;
  provider?: "stripe" | "paypal" | "creem";
};

// fit is binding-time semantics, not styling: reference-only material (UI
// screenshots, text-dense charts, official OG sprites) is a citation whose
// pixels are the evidence, so it renders whole ("contain") instead of being
// cropped or upscaled to a decorative frame. Absent fit also contains —
// forcing cover + a 16:9 box pixelated Fortnite OG art (2026-08-24).
export type PageImage = { src: string; alt: string; caption?: string; credit?: string; sourceUrl?: string; fit?: "cover" | "contain" };

export type PageTable = {
  caption?: string;
  columns: string[];
  rows: { cells: string[]; status?: "working" | "expired" | "unconfirmed"; recordKey?: string; evidenceRefs?: string[]; observedAt?: string; sourceUrl?: string }[];
  lastCheckedAt?: string;
};

export type PageVideo = { src: string; title: string };

export type PageSection = {
  id: string;
  title: string;
  body: string;
  items?: { title: string; body: string }[];
  image?: PageImage;
  video?: PageVideo;
  table?: PageTable;
  steps?: { title: string; body: string; image?: PageImage }[];
};

export type PageContent = {
  title?: string;
  description?: string;
  eyebrow?: string;
  h1: string;
  heroText: string;
  ctas: PageCta[];
  sections: PageSection[];
  faq?: { question: string; answer: string }[];
  schema?: Record<string, unknown>;
  hero?: PageImage;
  gallery?: PageImage[];
  videos?: PageVideo[];
};

const YOUTUBE_ID = /^[\w-]{11}$/;

/** Allowlisted YouTube URLs become youtube-nocookie embeds. Authored JSX
 *  still cannot emit a raw iframe — use <VideoEmbed src title />. */
export function youtubeEmbedSrc(raw: string | undefined | null): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    let id = "";
    if (host === "youtu.be") {
      id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      id = url.searchParams.get("v")
        || (url.pathname.startsWith("/embed/") ? url.pathname.split("/")[2] ?? "" : "")
        || (url.pathname.startsWith("/shorts/") ? url.pathname.split("/")[2] ?? "" : "");
    } else {
      return null;
    }
    return YOUTUBE_ID.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

// A missing or malformed content file must never take the whole build down.
// The route contract always carries a title and description, so a route can
// still render an honest, indexable page from its own metadata.
const VISITOR_HEADING_PREFIX = /^(direct answer:\s*|ui proof:\s*|what the page can prove(?: today)?:?\s*|mission for about\s*|(?:bounded\s+)?validation[- ]preview[:\s]*)/i;
const VISITOR_PIPELINE_TOKEN = /\b(?:(?:bounded\s+)?validation[- ]preview|validation plan|checkout disabled|during validation)\b/gi;
const VISITOR_PIPELINE_SENTENCE = /\b(?:validation[- ]preview|bounded(?: validation)? preview|validation plan|checkout is disabled during validation|disabled during validation|checkout disabled|during validation|concurrency_slot(?:_opened)?|concurrency slot|closed-slot|before the slot opens|after the slot opens)\b/i;

function destutterHeading(value: string): string {
  const words = value.trim().split(/\s+/);
  if (words.length < 4) return value.trim();
  for (let n = Math.min(4, Math.floor(words.length / 2)); n >= 2; n -= 1) {
    for (let i = 0; i + n < words.length; i += 1) {
      const phrase = words.slice(i, i + n).map((word) => word.toLowerCase()).join(" ");
      for (let j = i + n; j + n <= words.length; j += 1) {
        if (words.slice(j, j + n).map((word) => word.toLowerCase()).join(" ") === phrase) {
          return [...words.slice(0, j), ...words.slice(j + n)].join(" ");
        }
      }
    }
  }
  return value.trim();
}

function softenShouting(value: string): string {
  if (value.length > 1 && value === value.toUpperCase() && /[A-Z]/.test(value) && !/[a-z]/.test(value)) {
    return value.toLowerCase().replace(/^([a-z])/, (match) => match.toUpperCase());
  }
  return value;
}

function sanitizeHeading(value: string): string {
  let next = destutterHeading(String(value ?? "").replace(VISITOR_HEADING_PREFIX, "").trim());
  const withoutToken = next.replace(new RegExp(VISITOR_PIPELINE_TOKEN.source, "gi"), "").replace(/\s+/g, " ").trim();
  if (withoutToken !== next) next = softenShouting(withoutToken);
  if (!next) return "";
  return next.replace(/^([a-z])/, (match) => match.toUpperCase());
}

// Research evidence ids ("ev_019") are the planning ledger's citations, not
// visitor copy: 宝宝辅食's home page printed "(ev_019, ev_022)" mid-sentence
// (owner design review, 2026-10-12). The sources themselves still render as
// the page's reference links.
const EVIDENCE_MARKER_GROUP = /\s*[（(\[【]\s*(?:ev_\d{1,4}[a-z]?\s*[,，、;；]?\s*)+[)）\]】]/gi;
const EVIDENCE_MARKER = /\s*\bev_\d{1,4}[a-z]?\b/gi;

function stripEvidenceMarkers(value: string): string {
  return value.replace(EVIDENCE_MARKER_GROUP, "").replace(EVIDENCE_MARKER, "").replace(/\s+([,.;:!?，。；：！？])/g, "$1");
}

function sanitizeProse(value: string): string {
  const normalized = stripEvidenceMarkers(String(value ?? "")).replace(VISITOR_HEADING_PREFIX, "").replace(/\bthis shard\b/gi, "this page").trim();
  if (!normalized) return "";
  return (normalized.match(/[\s\S]*?(?:[.!?。！？]+(?=\s|$)|$)/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter((sentence) => !VISITOR_PIPELINE_SENTENCE.test(sentence))
    .join(" ")
    .trim();
}

export function sanitizePageContent(page: PageContent): PageContent {
  return {
    ...page,
    // title/description are the frozen SERP contract. Visitor-heading cleanup
    // may normalize H1/section prose, but it must never rewrite the H1 to the
    // SERP title (semantic:route:*:h1 binds the rendered heading to freeze)
    // and must never rewrite metadata.
    title: page.title,
    eyebrow: page.eyebrow ? sanitizeHeading(page.eyebrow) : page.eyebrow,
    h1: sanitizeHeading(page.h1),
    heroText: sanitizeProse(page.heroText),
    sections: (page.sections ?? []).map((section) => ({
      ...section,
      title: sanitizeHeading(section.title) || "Overview",
      body: sanitizeProse(section.body),
      items: section.items?.map((item) => ({ ...item, title: sanitizeHeading(item.title), body: sanitizeProse(item.body) })),
      steps: section.steps?.map((step) => ({ ...step, title: sanitizeHeading(step.title), body: sanitizeProse(step.body) })),
      table: section.table
        ? { ...section.table, caption: section.table.caption ? sanitizeHeading(section.table.caption) : section.table.caption }
        : section.table,
    })),
    faq: page.faq?.map((item) => ({ question: sanitizeHeading(item.question), answer: sanitizeProse(item.answer) })),
  };
}

export function contentFromRoute(route?: Route): PageContent {
  return {
    h1: route?.title ?? "",
    heroText: route?.description ?? "",
    ctas: [],
    sections: [],
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: route?.title ?? "",
      description: route?.description ?? "",
    },
  };
}

export function resolveHref(href: string, routes: Route[]): string {
  if (href.startsWith("/")) return href;
  const route = routes.find((r) => r.contentKey === href || r.path === href);
  return route ? route.path : `#${href}`;
}

/** The generated entity mark for a table row's recordKey — the same slug the
 *  build writes under /images/entities/ (lowercase, non-alphanumerics → "-").
 *  Concatenating the raw key ("rec_carved-pumpkin.svg") 404s against the
 *  emitted "rec-carved-pumpkin.svg" (Minecraft Enchantment Calculator,
 *  2026-10-05). Returns null when the build emitted no icon for the key. */
export function entityIconPath(recordKey: string | null | undefined): string | null {
  const slug = String(recordKey ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (slug.length < 2) return null;
  // Only a file the build emitted: marks are capped and planned icons have their
  // own paths, so a built path rendered broken images (2026-10-09).
  const marks = entityMarks as Record<string, string>;
  if (marks[slug]) return marks[slug];
  // Planned icons carry a collection prefix ("target-lamball") while a tool's
  // dataset rows use the bare id ("lamball"); QA matches the same way, and
  // Palworld's Pal table rendered no portraits over the mismatch (2026-10-09).
  const suffixed = Object.keys(marks).find((key) => key.endsWith(`-${slug}`));
  return suffixed ? marks[suffixed] : null;
}

/** Visible outbound citations the frozen copy already carries. Native interiors
 *  often render the words and drop the anchors; the platform document wrapper
 *  (and FrozenCopyPage) re-emit these so an indexable page cannot fail
 *  content:eeat-citations with evidence sitting unused in props. */
export type FrozenCitation = { href: string; label: string };

const HTTPS_HREF = /^https:\/\//i;
const MARKDOWN_HTTPS = /\[([^\]]{1,120})\]\((https:\/\/[^)\s]+)\)/g;
const BARE_HTTPS = /\bhttps:\/\/[^\s)\]<"']+/g;
const MAX_FROZEN_CITATIONS = 24;

export function frozenCopyCitations(content: PageContent, ownHost?: string): FrozenCitation[] {
  const seen = new Set<string>();
  const out: FrozenCitation[] = [];
  const add = (href: string | undefined | null, label?: string) => {
    const raw = typeof href === "string" ? href.trim() : "";
    if (!HTTPS_HREF.test(raw)) return;
    try {
      const url = new URL(raw);
      if (url.protocol !== "https:") return;
      if (ownHost && url.host === ownHost) return;
      // A placeholder host is the site before it has a domain, never a source.
      if (/(?:^|\.)(?:example|invalid|test|localhost|local)$|^(?:www\.)?example\.(?:com|org|net)$/i.test(url.hostname)) return;
      const key = `${url.host}${url.pathname}`;
      if (seen.has(key)) return;
      seen.add(key);
      const text = (label && label.trim()) || url.hostname.replace(/^www\./, "");
      out.push({ href: url.toString(), label: text.slice(0, 80) });
    } catch {
      // malformed URL is not a citation
    }
  };
  const scanText = (value: string | undefined) => {
    if (!value) return;
    const markdownHrefs = new Set<string>();
    for (const match of value.matchAll(MARKDOWN_HTTPS)) {
      markdownHrefs.add(match[2]);
      add(match[2], match[1]);
    }
    for (const match of value.matchAll(BARE_HTTPS)) {
      if (!markdownHrefs.has(match[0])) add(match[0]);
    }
  };
  add(content.hero?.sourceUrl, content.hero?.credit);
  for (const image of content.gallery ?? []) add(image.sourceUrl, image.credit);
  scanText(content.heroText);
  for (const section of content.sections ?? []) {
    scanText(section.body);
    add(section.image?.sourceUrl, section.image?.credit);
    for (const item of section.items ?? []) {
      scanText(item.title);
      scanText(item.body);
    }
    for (const step of section.steps ?? []) {
      scanText(step.title);
      scanText(step.body);
      add(step.image?.sourceUrl, step.image?.credit);
    }
    for (const row of section.table?.rows ?? []) {
      add(row.sourceUrl);
      for (const cell of row.cells ?? []) scanText(cell);
      for (const ref of row.evidenceRefs ?? []) add(ref);
    }
  }
  for (const entry of content.faq ?? []) {
    scanText(entry.question);
    scanText(entry.answer);
  }
  return out.slice(0, MAX_FROZEN_CITATIONS);
}

export function buildSiteConfig(config: SiteConfig): string {
  return JSON.stringify(config, null, 2);
}
