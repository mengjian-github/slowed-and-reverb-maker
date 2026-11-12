import type { ReactNode } from "react";
import type { Route, SiteConfig } from "@/lib/site-config";
import type { PageContent } from "@/lib/content";

// The floor's own prop types, from the platform data contract — never from
// registry.tsx, which an authoring or repair agent may rewrite with its own
// looser types (AI Video Summary's build check, TS2339 on hero.credit, 2026-10-12).
type NativeRouteProps = { route: Route; content: PageContent; config: SiteConfig };
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
import { VideoEmbed } from "@/components/VideoEmbed";
import DatasetSearch from "./DatasetSearch";

function normalizeVisitorPath(path: string) {
  const trimmed = String(path ?? "").trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return trimmed;
  const hashAt = trimmed.indexOf("#");
  const raw = hashAt >= 0 ? trimmed.slice(0, hashAt) : trimmed;
  const hash = hashAt >= 0 ? trimmed.slice(hashAt) : "";
  const normalized = raw === "/" ? "/" : raw.endsWith("/") ? raw : raw + "/";
  return normalized + hash;
}

function knownVisitorPaths(config: NativeRouteProps["config"]) {
  const known = new Set(["/"]);
  if (config.runtimeRequirements?.requiresAuth) {
    for (const path of ["/account/", "/login/", "/signup/", "/logout/"]) known.add(path);
  }
  if (config.runtimeRequirements?.requiresBilling) {
    for (const path of ["/pricing/", "/plans/"]) known.add(path);
  }
  for (const entry of config.routes ?? []) {
    const path = String(entry.path ?? "").trim();
    if (path.startsWith("/") && !path.startsWith("//")) known.add(normalizeVisitorPath(path).split("#")[0]);
  }
  return known;
}

function safeVisitorHref(href: string, known: Set<string>) {
  const trimmed = String(href ?? "").trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return trimmed;
  const normalized = normalizeVisitorPath(trimmed);
  const path = normalized.split("#")[0];
  return known.has(path) ? normalized : "/";
}

// A long section body reads as a wall on screen (owner design review,
// 2026-10-12): it renders as short paragraphs split at sentence ends, about
// sixty words each. The words are the frozen copy, unchanged. A Latin
// sentence ends at punctuation followed by a space: splitting at every dot cut
// "brodandtaylor.com" inside a link and rejoined it as "brodandtaylor. com",
// an href no browser opens (Starter Feeding /about/, 2026-10-26).
function paragraphsOf(value: string | undefined): string[] {
  const sentences = String(value ?? "").split(/(?<=[.!?])\s+|(?<=[。！？])\s*/).filter((part) => part.trim());
  const weight = (text: string) => (text.match(/[A-Za-z0-9']+/g) ?? []).length + (text.match(/[\u3400-\u9fff]/g) ?? []).length / 2;
  const out: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const next = current ? `${current}${/[。！？]$/.test(current) ? "" : " "}${sentence}` : sentence;
    if (current && weight(next) > 65) {
      out.push(current);
      current = sentence;
    } else {
      current = next;
    }
  }
  if (current) out.push(current);
  return out;
}

function richText(value: string | undefined, known?: Set<string>) {
  const text = value ?? "";
  const nodes: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)]*)\)|\*\*([^*]+)\*\*|__([^_]+)__/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    if (match[1] !== undefined) {
      const href = known ? safeVisitorHref(match[2].trim(), known) : match[2].trim();
      const external = /^https:\/\//i.test(href);
      const safe = external || href.startsWith("/");
      nodes.push(safe
        ? <a key={index} href={href} {...(external ? { rel: "nofollow noopener", target: "_blank" } as const : {})}>{match[1]}</a>
        : <span key={index}>{match[1]}</span>);
    } else {
      nodes.push(<strong key={index}>{match[3] || match[4]}</strong>);
    }
    index += 1;
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes.length ? nodes : text;
}

function latestCheckedAt(content: NativeRouteProps["content"]): string | null {
  const candidates: string[] = [];
  const add = (value: unknown) => {
    if (typeof value === "string") {
      const match = value.match(/\d{4}-\d{2}-\d{2}/);
      if (match) candidates.push(match[0]);
    }
  };
  add(content.heroText);
  for (const section of content.sections ?? []) {
    add(section.body);
    add(section.table?.lastCheckedAt);
    for (const row of section.table?.rows ?? []) add(row.observedAt);
    for (const item of section.items ?? []) add(item.body);
  }
  const scanSchema = (value: unknown): void => {
    if (Array.isArray(value)) { value.forEach(scanSchema); return; }
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (key === "dateModified" || key === "datePublished") add(child);
      scanSchema(child);
    }
  };
  scanSchema(content.schema);
  if (!candidates.length) {
    const nested = JSON.stringify(content).match(/\d{4}-\d{2}-\d{2}/g) ?? [];
    candidates.push(...nested);
  }
  candidates.sort();
  return candidates.at(-1) ?? null;
}

function assetSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Every table row ships twice, in the HTML and in the RSC payload: a 500-record
// hub directory made Jev API's /alternatives/ 1.4 MB and failed the 1 MB page
// gate (2026-10-12). Past the cap, the rows the section body links to come
// first, then the rest in order.
const TABLE_ROW_LIMIT = 100;

function visibleTableRows<T extends { cells: string[] }>(rows: T[], body: string | undefined): T[] {
  if (rows.length <= TABLE_ROW_LIMIT) return rows;
  const text = String(body ?? "");
  const keep = new Set(rows.filter((row) => text.includes("[" + String(row.cells[0] ?? "") + "](")).slice(0, TABLE_ROW_LIMIT));
  for (const row of rows) {
    if (keep.size >= TABLE_ROW_LIMIT) break;
    keep.add(row);
  }
  return rows.filter((row) => keep.has(row));
}

// A table whose rows all cite one page names that source once, under the
// table. Key Finder's Camelot table carried the same "Source" link on each of
// its 24 rows, and the release QA's tester read it as leaked metadata beside
// every code (run_614f3dff-e60-infra-qa, 2026-11-11). Rows that cite
// different pages keep their own link.
function sharedRowSource(rows: Array<{ sourceUrl?: string | null }>): string {
  const urls = rows.map((row) => String(row.sourceUrl ?? "").trim()).filter(Boolean);
  return urls.length > 1 && new Set(urls).size === 1 ? urls[0] : "";
}

function sourceHost(url: string): string {
  try {
    const host = new URL(url).hostname;
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return url;
  }
}

// A declared dataset-query capability renders on this page as a working table
// filter (./DatasetSearch) on its own source section when the page carries it.
// Only a site with one such capability falls back to the page's first data
// table: 宝宝辅食's capability named "stage-table" while its table section was
// "full-timetable" (2026-10-12). Starter Feeding declares three, each bound to
// its own chart on an authored page; the fallback put the first one on the
// methodology and discard pages' three-row tables, and QA ran the chart's
// samples against them (2026-10-28).
function datasetQueryBinding(config: NativeRouteProps["config"], content: NativeRouteProps["content"]) {
  const capabilities = ((config as { capabilities?: Array<{ id?: string; operation?: string; params?: Record<string, unknown> }> }).capabilities ?? [])
    .filter((entry) => entry?.operation === "dataset-query" && entry.id);
  const sections = content.sections ?? [];
  const tableNamed = (id: unknown) => sections.find((entry) => entry.id === id && entry.table?.rows?.length);
  const own = capabilities.find((entry) => tableNamed(entry.params?.source));
  const capability = own ?? (capabilities.length === 1 ? capabilities[0] : null);
  if (!capability) return null;
  const params = capability.params ?? {};
  const section = own ? tableNamed(params.source) : sections.find((entry) => entry.table?.rows?.length);
  if (!section) return null;
  const searchColumns = Array.isArray(params.searchColumns)
    ? params.searchColumns.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value >= 0)
    : undefined;
  return { id: String(capability.id), sectionId: section.id, searchColumns, statusFilter: params.statusFilter === true };
}

function isSequenceRow(recordKey: string | undefined, firstCell: string | undefined) {
  const values = [recordKey, firstCell].map((value) => String(value ?? "").trim()).filter(Boolean);
  return values.some((value) => /^(?:(?:step|phase|cycle(?:-step)?)[-_\s]*)?\d{1,3}$/i.test(value));
}

function generatedMarkPath(recordKey: string | undefined, firstCell: string | undefined) {
  if (isSequenceRow(recordKey, firstCell)) return "";
  const slug = assetSlug(String(recordKey || firstCell || ""));
  if (slug.length < 2) return "";
  return "/images/entities/" + slug + ".svg";
}

function usableSrc(src: string | undefined) {
  const value = String(src ?? "").trim();
  // Slot paths are the staging area for close-the-slot generation, never
  // page illustrations. A 680KB white-padded clock still living under
  // /images/slots/ painted as a giant blank figure (Pomodoro, 2026-08-23).
  if (!value || /\/images\/slots\//i.test(value)) return "";
  return value;
}

function usableHeroSrc(src: string | undefined) {
  const value = usableSrc(src);
  // Official OG sprites and entity marks are citations, not page heroes.
  // Binding them as FrozenCopy hero-media left an unlabeled floating
  // thumbnail on /reference/ (Fortnite 2026-08-24).
  if (!value || /\/images\/official\//i.test(value) || /\/images\/entities\//i.test(value)) return "";
  return value;
}

function takeUnique(src: string | undefined, claimed: Set<string>) {
  const value = usableSrc(src);
  if (!value || claimed.has(value)) return "";
  claimed.add(value);
  return value;
}

function uniquePlanFigure(config: NativeRouteProps["config"], claimed: Set<string>, roles: string[]) {
  const found = (config.assetPlan ?? []).find((asset) =>
    roles.includes(String(asset.role ?? "")) && usableHeroSrc(asset.path) && !claimed.has(asset.path)
  );
  if (!found?.path) return null;
  claimed.add(found.path);
  return found;
}

function entityIconFor(config: NativeRouteProps["config"], recordKey: string | undefined, firstCell: string | undefined, routePath?: string) {
  if (isSequenceRow(recordKey, firstCell)) return null;
  const plan = config.assetPlan ?? [];
  const rowKeys = [recordKey, firstCell].map((value) => String(value ?? "").trim()).filter(Boolean);
  const slugs = rowKeys.map(assetSlug).filter((value) => value.length >= 3);
  if (rowKeys.length) {
    const exact = plan.find((asset) => asset.role === "entity-icon" && asset.path && asset.recordKey && rowKeys.includes(String(asset.recordKey)));
    if (exact && usableSrc(exact.path)) return exact;
    const slugHit = plan.find((asset) => {
      if (asset.role !== "entity-icon" || !asset.path || !asset.recordKey) return false;
      const keySlug = assetSlug(String(asset.recordKey));
      return slugs.some((value) => keySlug === value || keySlug.endsWith(value) || value.endsWith(keySlug));
    });
    return slugHit && usableSrc(slugHit.path) ? slugHit : null;
  }
  const routeSlug = assetSlug(String(routePath ?? ""));
  if (!routeSlug) return null;
  const routed = plan.find((asset) => {
    if (!asset.path || !asset.route) return false;
    const assetRoute = assetSlug(String(asset.route));
    if (!(assetRoute === routeSlug || assetRoute.endsWith(routeSlug))) return false;
    return asset.role === "entity-icon" || asset.role === "hero-subject";
  });
  return routed && usableSrc(routed.path) ? routed : null;
}

const TEXT_PATH = /\/(?:privacy|terms|cookies?(?:-policy)?|refund|legal|aup|acceptable-use|contact(?:-us)?|about|methodology|pricing|plans|updates|changelog|versions?)\//i;

function pageKind(path: string) {
  const value = String(path ?? "");
  if (/\/(?:privacy|terms|cookies?(?:-policy)?|refund|legal|aup|acceptable-use)\//i.test(value)) return "legal";
  if (/\/(?:pricing|plans)\//i.test(value)) return "pricing";
  if (/\/(?:about(?:-us)?|methodology|contact(?:-us)?|updates|changelog|versions?)\//i.test(value)) return "document";
  return "content";
}

function sectionShape(section: { table?: unknown; steps?: unknown[]; items?: unknown[]; image?: unknown; video?: unknown }, index: number) {
  if (section.table) return "table";
  if (section.steps && section.steps.length) return "steps";
  if (section.items && section.items.length) return "cards";
  if (section.image || section.video) return "media";
  if (index === 0) return "lede";
  return index % 2 === 1 ? "callout" : "prose";
}

function pageHero(content: NativeRouteProps["content"], config: NativeRouteProps["config"], route: NativeRouteProps["route"]): { src: string; alt: string; fit?: "cover" | "contain"; sourceUrl?: string; credit?: string } | null {
  const path = String(route?.path ?? "/");
  // Pricing/legal jobs are plans and prose. A decorative clock in the hero
  // dominated /pricing/ and failed visual-review (Pomodoro, 2026-08-22).
  if (TEXT_PATH.test(path)) return null;
  if (content.hero?.src && usableHeroSrc(content.hero.src)) return content.hero;
  // Only the homepage borrows the site-wide hero-subject. Inner pages that
  // stamped the same key art as a contained thumbnail failed visual-review
  // (Fortnite /reference/, 2026-08-24).
  if (path !== "/" && path !== "") return null;
  const planned = (config.assetPlan ?? []).find((asset) => asset.role === "hero-subject" && usableHeroSrc(asset.path));
  if (planned?.path) return { src: planned.path, alt: planned.alt || content.h1 };
  return null;
}

function uniqueGallery(
  images: Array<{ src: string; alt: string; fit?: "cover" | "contain"; sourceUrl?: string; credit?: string }>,
): Array<{ src: string; alt: string; fit?: "cover" | "contain"; sourceUrl?: string; credit?: string }> {
  const seen = new Set<string>();
  return images.filter((image) => {
    const src = usableSrc(image.src);
    if (!src || seen.has(src)) return false;
    seen.add(src);
    return true;
  });
}

function pageGallery(content: NativeRouteProps["content"], config: NativeRouteProps["config"], route: NativeRouteProps["route"], heroSrc: string | undefined): Array<{ src: string; alt: string; fit?: "cover" | "contain"; sourceUrl?: string; credit?: string }> {
  if (content.gallery?.length) return uniqueGallery(content.gallery);
  const path = String(route?.path ?? "/");
  if (TEXT_PATH.test(path)) return [];
  if ((content.sections ?? []).some((section) => section.image?.src || (section.table?.rows?.length ?? 0) >= 3)) return [];
  const pathIcon = entityIconFor(config, undefined, undefined, path);
  if (pathIcon?.path && pathIcon.path === heroSrc) return [];
  const seen = new Set<string>();
  return (config.assetPlan ?? [])
    .filter((asset) => {
      if (asset.role !== "entity-icon" || !usableSrc(asset.path) || asset.path === heroSrc) return false;
      if (asset.recordKey) return false;
      if (seen.has(asset.path)) return false;
      seen.add(asset.path);
      return true;
    })
    .slice(0, 8)
    .map((asset) => ({ src: asset.path, alt: asset.alt || String(asset.recordKey ?? "Character") }));
}

function pageVideos(content: NativeRouteProps["content"]) {
  const seen = new Set<string>();
  const out: { src: string; title: string }[] = [];
  const add = (src: string | undefined, title?: string) => {
    const value = String(src ?? "").trim();
    if (!value || seen.has(value)) return;
    seen.add(value);
    out.push({ src: value, title: title || "Video" });
  };
  for (const video of content.videos ?? []) add(video.src, video.title);
  for (const section of content.sections ?? []) add(section.video?.src, section.video?.title);
  const scan = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) { value.forEach(scan); return; }
    const rec = value as Record<string, unknown>;
    const type = String(rec["@type"] ?? rec.type ?? "");
    if (/VideoObject/i.test(type)) add(String(rec.embedUrl ?? rec.url ?? rec.contentUrl ?? ""), String(rec.name ?? rec.title ?? "Video"));
    for (const child of Object.values(rec)) scan(child);
  };
  scan(content.schema);
  return out;
}

function commerceCtas(content: NativeRouteProps["content"], config: NativeRouteProps["config"], route: NativeRouteProps["route"]) {
  const path = String(route?.path ?? "/");
  const legal = /\/(?:privacy|terms|cookies?(?:-policy)?|refund|legal|aup|acceptable-use)\//i.test(path);
  const ctas = (content.ctas ?? []).filter((cta) => {
    if (cta.action === "google_login") return false;
    if ((legal || config.publicSalesAllowed === false) && cta.action === "checkout") return false;
    return true;
  });
  const billingSurface = path === "/" || /\/(?:pricing|plans)\//i.test(path);
  const hasPricing = (config.routes ?? []).some((entry) => /\/(?:pricing|plans)\/?$/i.test(String(entry.path ?? "")));
  if (config.publicSalesAllowed !== false && !legal && billingSurface && hasPricing && config.runtimeRequirements?.requiresBilling && !ctas.some((cta) => cta.action === "checkout")) {
    ctas.push({ href: "/pricing/", label: "Start Pro", primary: true, action: "checkout" });
  }
  const ranked = ctas.filter((cta) => cta.action !== "checkout" || hasPricing);
  let primarySeen = false;
  return ranked.map((cta) => {
    if (!cta.primary) return cta;
    if (primarySeen) return { ...cta, primary: false };
    primarySeen = true;
    return cta;
  });
}

function planNameFromTitle(title: string) {
  const raw = String(title ?? "").trim();
  const name = raw.split(/\s*[—–|·•]\s*|\s+\/\s+|\s*\(\s*|\$/)[0]?.trim() ?? "";
  return name.replace(/\s+/g, " ");
}

function planPriceFromTitle(title: string) {
  const raw = String(title ?? "").trim();
  const parts = raw.split(/\s*[—–]\s*/);
  if (parts.length < 2) return "";
  return parts.slice(1).join(" — ").trim();
}

function pricingCardAction(item: { title: string; body?: string }, ctas: ReturnType<typeof commerceCtas>, language: string) {
  const lang = language.toLowerCase();
  const name = planNameFromTitle(item.title);
  const product = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "pro";
  const free = /$0|gratis|\bfree\b/i.test(item.title) && !/\$[1-9]/.test(item.title);
  if (free) {
    return {
      href: "/",
      label: lang.startsWith("zh") ? "免费开始" : lang.startsWith("it") ? "Inizia gratis" : "Start free",
      primary: false,
      checkout: false,
      product: "",
    };
  }
  const paid = ctas.find((cta) => cta.action === "checkout");
  const label = lang.startsWith("zh")
    ? ("升级到 " + (name || "Pro"))
    : lang.startsWith("it")
      ? ("Passa a " + (name || "Pro"))
      : ("Upgrade to " + (name || "Pro"));
  return {
    href: paid?.href || "/pricing/",
    label,
    primary: true,
    checkout: true,
    product,
  };
}

const SECTION_RHYTHM: number[] = [1,2,1,0,0,0];

const TICKER = true;

export default function FrozenCopyPage(props: any) {
  const { route, content, config } = props as NativeRouteProps;
  const PERSUADE_PAGE = /^\/(?:[a-z]{2}(?:-[a-z]{2,4})?\/)?$/i.test(String(route?.path ?? "")) || pageKind(String(route?.path ?? "")) === "pricing";
  const lastChecked = latestCheckedAt(content);
  const checkedLabel = String(config.language ?? "").trim().toLowerCase().startsWith("zh") ? "最近核对：" : "Last checked ";
  // The contact address is the site's own domain mailbox, rendered by the
  // platform (shared/site-contact.ts); before the domain is connected the page
  // says so instead of pointing at an address that does not exist.
  const contactPage = /\/contact(?:-us)?\/?$/i.test(String(route.path ?? ""));
  const zhContact = String(config.language ?? "").trim().toLowerCase().startsWith("zh");
  const datasetQuery = datasetQueryBinding(config, content);
  // A section titled like the page itself ("使用条款" under the h1 "使用条款",
  // 宝宝辅食 /terms/, 2026-10-10) says nothing new and fails QA (page title not
  // repeated): its body still renders, its heading does not.
  const headingKey = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  const repeatsH1 = (title: unknown) => Boolean(headingKey(title)) && headingKey(title) === headingKey(content.h1);
  // Spot visuals (owner design review, 2026-10-12): the reference tool sites
  // pair every short text block with a visual. config.sectionIcons already
  // maps section and card titles to the site's icon language at build time;
  // a prose section with a mark gets it as a large spot tile beside the text,
  // and a card list shows marks only when every card has one.
  const glyphOf = (title: unknown) => config.sectionIcons?.[String(title ?? "")] ?? null;
  const glyphSvg = (title: unknown, className: string) => {
    const glyph = glyphOf(title);
    if (!glyph) return null;
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true"
        {...(glyph.filled ? { fill: "currentColor" } : { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const })}>
        <path d={glyph.d} />
      </svg>
    );
  };
  const spotted = (section: { title?: string; table?: unknown; steps?: unknown[]; items?: unknown[]; image?: unknown; video?: unknown }, index: number) =>
    !legalPage && !pricingPage && ["prose", "callout"].includes(sectionShape(section, index)) && Boolean(glyphOf(section.title));
  const listGlyphs = (items: { title?: string }[] | undefined) =>
    !pricingPage && Boolean(items?.length) && (items ?? []).every((item) => Boolean(glyphOf(item.title)));
  const knownPaths = knownVisitorPaths(config);
  const ctas = commerceCtas(content, config, route).map((cta) => ({ ...cta, href: safeVisitorHref(cta.href, knownPaths) }));
  const pricingPage = /\/(?:pricing|plans)\//i.test(String(route.path ?? ""));
  const legalPage = /\/(?:privacy|terms|cookies?(?:-policy)?|refund|legal|aup|acceptable-use)\//i.test(String(route.path ?? ""));
  const heroCtas = pricingPage ? ctas.filter((cta) => cta.action !== "checkout") : ctas;
  const videos = pageVideos(content);
  const claimedIcons = new Set<string>();
  const rawHero = pageHero(content, config, route);
  const fillHero = !rawHero && !TEXT_PATH.test(String(route.path ?? ""))
    ? uniquePlanFigure(config, claimedIcons, ["gallery-media", "section-media"])
    : null;
  const heroSrc = rawHero ? takeUnique(rawHero.src, claimedIcons) : (fillHero?.path || "");
  const hero = heroSrc && rawHero
    ? { ...rawHero, src: heroSrc }
    : (heroSrc && fillHero ? { src: fillHero.path, alt: fillHero.alt || content.h1 } : null);
  const isHome = (String(route.path ?? "/").replace(/\/+$/, "") || "/") === "/";
  const gallery = uniqueGallery(pageGallery(content, config, route, hero?.src)).filter((image) => takeUnique(image.src, claimedIcons));
  return (
    <div className="site-shell frozen-copy-shell" data-page-kind={pageKind(route.path)}>
      <SiteHeader config={config} locales={config.locales ?? []} currentPath={route.path} />
      <main id="main">
        <article className="frozen-copy-article">
          <section className={hero?.src ? "hero has-media" : "hero"} data-hero-variant="eyebrow-band">
            <div className="hero-copy">
              {content.eyebrow ? <span className="eyebrow">{content.eyebrow}</span> : null}
              <h1>{content.h1}</h1>
              {content.heroText ? <p className="lead">{richText(content.heroText, knownPaths)}</p> : null}
              {lastChecked && !pricingPage ? <p className="last-checked last-updated">{checkedLabel}<time className="last-checked last-updated" dateTime={lastChecked}>{lastChecked}</time></p> : null}
              {heroCtas.length ? (
                <div className="ctas">
                  {heroCtas.map((cta) => (
                    <a
                      key={cta.href + cta.label}
                      href={cta.href}
                      className={cta.primary ? "primary" : undefined}
                      {...(cta.action === "checkout" ? { href: "/api/pay/checkout?plan=" + encodeURIComponent(cta.product || "pro"), "data-shipsite-checkout": "", "data-product": cta.product || "pro" } as const : {})}
                      {...(cta.action === "google_login" ? { "data-shipsite-google-login": "" } as const : {})}
                    >{cta.label}</a>
                  ))}
                </div>
              ) : null}
              {contactPage ? (
                config.contactEmail
                  ? <p className="contact-channel">{zhContact ? "邮箱：" : "Email: "}<a href={"mailto:" + config.contactEmail}>{config.contactEmail}</a></p>
                  : <p className="contact-channel" data-contact-pending="">{zhContact ? "本站的联系邮箱会在站点域名接通后显示在这里。" : "This site's contact address appears here once its own domain is connected."}</p>
              ) : null}
            </div>
            {hero?.src ? (
              <figure className="media hero-media" data-fit={hero.fit || "contain"}>
                <img src={hero.src} alt={hero.alt || ""} aria-hidden={hero.alt ? undefined : true} fetchPriority={isHome ? "high" : undefined} loading={isHome ? undefined : "lazy"} decoding="async" />
                {hero.sourceUrl ? <figcaption><a href={hero.sourceUrl} rel="nofollow noopener" target="_blank">{hero.credit || hero.sourceUrl}</a></figcaption> : null}
              </figure>
            ) : null}
          </section>
          {TICKER ? (
            <div className="ticker-band" data-motion="marquee" aria-hidden="true">
              <div className="ticker-track">
                {[...Array(16)].map((run) => (
                  <span key={run} className="ticker-run">{config.brandName}{content.eyebrow ? ` — ${content.eyebrow}` : ""} · </span>
                ))}
              </div>
            </div>
          ) : null}
          {(content.sections ?? []).map((section, sectionIndex) => (
            <section key={section.id} id={section.id} className="frozen-copy-section" data-spot={spotted(section, sectionIndex) ? "true" : undefined} data-shape={sectionShape(section, sectionIndex)} data-rhythm={SECTION_RHYTHM[sectionIndex % SECTION_RHYTHM.length]} data-motion={PERSUADE_PAGE && (section.items?.length || section.table) ? "scroll-reveal" : undefined}>
              {(pricingPage && /^(plans|pricing|方案|定价)$/i.test(String(section.title ?? ""))) || repeatsH1(section.title) ? null : <h2>{section.title}</h2>}
              {section.body && !(pricingPage && /^(plans|pricing|方案|定价)$/i.test(String(section.title ?? ""))) ? paragraphsOf(section.body).map((paragraph, index) => <p key={index}>{richText(paragraph, knownPaths)}</p>) : null}
              {spotted(section, sectionIndex) ? <div className="section-spot" aria-hidden="true">{glyphSvg(section.title, "section-spot-glyph")}</div> : null}
              {section.image && takeUnique(section.image.src, claimedIcons) ? (
                <figure className="media" data-fit={section.image.fit || "contain"}>
                  <img src={section.image.src} alt={section.image.alt || ""} aria-hidden={section.image.alt ? undefined : true} loading="lazy" decoding="async" />
                  {section.image.sourceUrl ? <figcaption><a href={section.image.sourceUrl} rel="nofollow noopener" target="_blank">{section.image.credit || section.image.sourceUrl}</a></figcaption> : null}
                </figure>
              ) : null}
              {section.video?.src ? <VideoEmbed src={section.video.src} title={section.video.title} /> : null}
              {section.items?.length ? (
                legalPage ? (
                <dl className="legal-points">
                  {section.items.map((item) => (
                    <div key={item.title}>
                      <dt>{item.title}</dt>
                      <dd>{richText(item.body, knownPaths)}</dd>
                    </div>
                  ))}
                </dl>
                ) : (
                <ul className={/\/(?:pricing|plans)\//i.test(String(route.path ?? "")) ? "cards pricing-cards" : "cards"}>
                  {section.items.map((item) => {
                    const figure = uniquePlanFigure(config, claimedIcons, ["gallery-media", "section-media"]);
                    const pricing = /\/(?:pricing|plans)\//i.test(String(route.path ?? ""));
                    const action = pricing ? pricingCardAction(item, ctas, config.language ?? "en") : null;
                    const planName = pricing ? (planNameFromTitle(item.title) || item.title) : item.title;
                    const planPrice = pricing ? planPriceFromTitle(item.title) : "";
                    return (
                    <li key={item.title}>
                      {figure ? <img src={figure.path} alt={figure.alt || item.title} className="card-figure" loading="lazy" decoding="async" /> : null}
                      {!figure && listGlyphs(section.items) ? glyphSvg(item.title, "section-glyph") : null}
                      <strong>{planName}</strong>
                      {planPrice ? <p className="plan-price">{planPrice}</p> : null}
                      {item.body ? (
                        pricing && /;/.test(item.body)
                          ? <ul className="plan-features">{item.body.split(/\s*;\s*/).filter(Boolean).filter((line) => !/use Upgrade to start checkout|Paid plan —/i.test(line)).map((line, lineIndex) => <li key={lineIndex}>{richText(line, knownPaths)}</li>)}</ul>
                          : <p>{richText(item.body, knownPaths)}</p>
                      ) : null}
                      {action ? (
                        <a
                          className={action.primary ? "primary plan-cta" : "plan-cta"}
                          href={safeVisitorHref(action.href, knownPaths)}
                          {...(action.checkout ? { href: "/api/pay/checkout?plan=" + encodeURIComponent(action.product || "pro"), "data-shipsite-checkout": "", "data-product": action.product || "pro" } as const : {})}
                        >{action.label}</a>
                      ) : null}
                    </li>
                    );
                  })}
                </ul>
                )
              ) : null}
              {section.steps?.length ? (
                <ol className="steps">
                  {section.steps.map((step) => (
                    <li key={step.title}>
                      <strong>{step.title}</strong>
                      {step.body ? <p>{richText(step.body, knownPaths)}</p> : null}
                      {step.image && takeUnique(step.image.src, claimedIcons) ? <figure className="media step-media" data-fit={step.image.fit || "contain"}><img src={step.image.src} alt={step.image.alt || ""} aria-hidden={step.image.alt ? undefined : true} loading="lazy" decoding="async" /></figure> : null}
                    </li>
                  ))}
                </ol>
              ) : null}
              {section.table ? (
                <div className="table-wrap" data-mobile-presentation="scroll">
                  {section.table.lastCheckedAt ? <p className="last-checked last-updated">{checkedLabel}<time className="last-checked last-updated" dateTime={section.table.lastCheckedAt}>{section.table.lastCheckedAt}</time></p> : null}
                  {datasetQuery && section.id === datasetQuery.sectionId ? (
                    <DatasetSearch
                      capabilityId={datasetQuery.id}
                      columns={section.table.columns}
                      rows={visibleTableRows(section.table.rows, section.body).map((row) => ({ cells: row.cells, status: row.status, sourceUrl: row.sourceUrl }))}
                      searchColumns={datasetQuery.searchColumns}
                      statusFilter={datasetQuery.statusFilter}
                      language={String(config.language ?? "")}
                      caption={section.table.caption}
                    />
                  ) : (
                  <>
                  <table className="data-table" data-mobile-presentation="scroll">
                    {section.table.caption ? <caption>{section.table.caption}</caption> : null}
                    <thead>
                      <tr>{section.table.columns.map((column) => <th key={column}>{column}</th>)}</tr>
                    </thead>
                    <tbody>
                      {visibleTableRows(section.table.rows, section.body).map((row, rowIndex) => {
                        const planned = entityIconFor(config, row.recordKey, row.cells[0], route.path);
                        // A mark the build did not emit (its 240-mark cap) is a broken image: only a path the site config lists renders (an API comparison site's spec rows, 2026-10-09).
                        const markCandidate = generatedMarkPath(row.recordKey, row.cells[0]);
                        const markPath = markCandidate && (config.assetPlan ?? []).some((entry) => entry.path === markCandidate) ? markCandidate : "";
                        const found = planned?.path && usableSrc(planned.path)
                          ? planned
                          : (markPath ? { path: markPath, alt: String(row.cells[0] || row.recordKey || "") } : null);
                        const generated = Boolean(found?.path?.startsWith("/images/entities/"));
                        const icon = found?.path && (generated || !claimedIcons.has(found.path)) ? (claimedIcons.add(found.path), found) : null;
                        return (
                        <tr key={row.recordKey || rowIndex} className={row.status ? "status-" + row.status : undefined}>
                          {row.cells.map((cell, cellIndex) => (
                            <td key={cellIndex} className={row.status ? "status-cell status-" + row.status : undefined} data-label={section.table?.columns[cellIndex] || ""} data-status={row.status || undefined}>
                              {cellIndex === 0 && icon ? <img src={icon.path} alt={icon.alt || cell} className="row-entity-icon" width={72} height={72} loading="lazy" data-asset-role="entity-icon" /> : null}
                              {richText(cell, knownPaths)}
                              {cellIndex === 0 && row.sourceUrl && !sharedRowSource(section.table?.rows ?? []) ? (
                                <>{" "}<a className="row-source" href={row.sourceUrl} rel="nofollow noopener" target="_blank">Source</a></>
                              ) : null}
                            </td>
                          ))}
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {sharedRowSource(section.table.rows) ? (
                    <p className="table-source">{String(config.language ?? "").trim().toLowerCase().startsWith("zh") ? "来源：" : "Source: "}
                      <a className="row-source" href={sharedRowSource(section.table.rows)} rel="nofollow noopener" target="_blank">{sourceHost(sharedRowSource(section.table.rows))}</a></p>
                  ) : null}
                  </>
                  )}
                  {section.table.rows.length > TABLE_ROW_LIMIT ? (
                    <p className="table-note">{String(config.language ?? "").trim().toLowerCase().startsWith("zh")
                      ? "显示 " + TABLE_ROW_LIMIT + " / " + section.table.rows.length + " 条"
                      : "Showing " + TABLE_ROW_LIMIT + " of " + section.table.rows.length + " records"}</p>
                  ) : null}
                </div>
              ) : null}
            </section>
          ))}
          {gallery.length ? (
            <section id="gallery" className="frozen-copy-section">
              <h2>Gallery</h2>
              <div className="gallery">
                {gallery.map((image) => (
                  <figure key={image.src} className="media" data-fit={image.fit || "contain"}>
                    <img src={image.src} alt={image.alt || ""} aria-hidden={image.alt ? undefined : true} loading="lazy" decoding="async" {...(!content.gallery?.length ? { "data-asset-role": "entity-icon" } as const : {})} />
                    {image.sourceUrl ? <figcaption><a href={image.sourceUrl} rel="nofollow noopener" target="_blank">{image.credit || image.sourceUrl}</a></figcaption> : null}
                  </figure>
                ))}
              </div>
            </section>
          ) : null}
          {videos.length ? (
            <section id="videos" className="frozen-copy-section">
              <h2>Videos</h2>
              {videos.map((video) => <VideoEmbed key={video.src} src={video.src} title={video.title} />)}
            </section>
          ) : null}
          {content.faq?.length ? (
            <section id="faq" className="frozen-copy-section">
              <h2>{String(config.language ?? "").trim().toLowerCase().startsWith("zh") ? "常见问题" : "FAQ"}</h2>
              <div className="faq-list">
                {content.faq.map((entry) => (
                  <details key={entry.question}>
                    <summary>{entry.question}</summary>
                    <p>{richText(entry.answer, knownPaths)}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}
        </article>
      </main>
      <SiteFooter config={config} />
    </div>
  );
}
