import type { Route, SiteConfig, SiteLocale } from "../lib/site-config";
import { absoluteSiteUrl, hreflangAlternates, isPreviewDeployment, localeNav, localeNavGroups, localeNavMore, normalizeRoutePath, ogLocaleFor } from "../lib/site-config";
import { frozenCopyCitations, type PageContent } from "../lib/content";
import { siteStyles } from "../lib/site-styles";
import { recipeStyles } from "./native/recipe-styles";
import { ShipsiteRuntime } from "./ShipsiteRuntime";
// Static import by construction: the registry template always ships (empty by
// default), so a static export can resolve it at build time. The native
// authoring agent registers its route components there; this platform file
// stays pinned and only reads the map.
import { nativeRoutes } from "./native/registry";

function isPlaceholderHost(host: string): boolean {
  return /\.example(?:\.com)?$/i.test(host) || host.endsWith(".example");
}

function isHomeRoute(path: string | undefined): boolean {
  const value = String(path ?? "").replace(/\/+$/, "") || "/";
  return value === "/";
}

function rewritePlaceholderJsonLd(value: unknown, origin: string): unknown {
  if (typeof value === "string") {
    try {
      const url = new URL(value);
      if (isPlaceholderHost(url.hostname)) return new URL(`${url.pathname}${url.search}${url.hash}`, `${origin}/`).toString();
    } catch { /* not a URL */ }
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => rewritePlaceholderJsonLd(item, origin));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, rewritePlaceholderJsonLd(nested, origin)]));
  }
  return value;
}

function isRedundantWebPageSchema(schema: unknown): boolean {
  if (!schema || typeof schema !== "object") return false;
  const record = schema as Record<string, unknown>;
  const type = record["@type"];
  const types = Array.isArray(type) ? type : [type];
  if (!types.includes("WebPage")) return false;
  return Object.keys(record).every((key) => ["@context", "@type", "name", "url", "description", "headline", "title"].includes(key));
}

function breadcrumbListItem(name: string, url: string, position: number) {
  return {
    "@type": "ListItem",
    position,
    name,
    item: { "@type": "WebPage", "@id": url, name, url },
  };
}

function latestCheckedAt(content: PageContent): string | null {
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
  const scan = (value: unknown): void => {
    if (Array.isArray(value)) { value.forEach(scan); return; }
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (key === "dateModified" || key === "datePublished") add(child);
      scan(child);
    }
  };
  scan(content.schema);
  if (!candidates.length) {
    const nested = JSON.stringify(content).match(/\d{4}-\d{2}-\d{2}/g) ?? [];
    candidates.push(...nested);
  }
  candidates.sort();
  return candidates.at(-1) ?? null;
}

// Copy edits update content.faq independently of the originally authored
// schema. Keep its FAQ entities current, including @graph/array forms, and
// retain their IDs so other graph nodes keep resolving to the same entity.
function synchronizeFaqJsonLd(schema: unknown, entries: PageContent["faq"]) {
  let hasFaq = false;
  const mainEntity = (entries ?? []).map((entry) => ({
    "@type": "Question", name: entry.question,
    acceptedAnswer: { "@type": "Answer", text: entry.answer },
  }));
  const visit = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(visit);
    if (!value || typeof value !== "object") return value;
    const node = { ...(value as Record<string, unknown>) };
    const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
    if (types.includes("FAQPage")) {
      if (mainEntity.length) {
        node.mainEntity = mainEntity;
        hasFaq = true;
      } else {
        // No visible FAQ remains. Retain the page identity and other types,
        // but never leave the old hidden questions in the document.
        const remaining = types.filter((type) => type !== "FAQPage");
        node["@type"] = remaining.length ? (remaining.length === 1 ? remaining[0] : remaining) : "WebPage";
        delete node.mainEntity;
      }
    }
    for (const [key, child] of Object.entries(node)) node[key] = visit(child);
    return node;
  };
  const value = visit(schema);
  return { value, hasFaq };
}

function completeJsonLd(
  value: unknown,
  ctx: { title: string; h1: string; url: string; date: string | null; author: string | null },
): unknown {
  if (Array.isArray(value)) return value.map((item) => completeJsonLd(item, ctx));
  if (!value || typeof value !== "object") return value;
  const node = { ...(value as Record<string, unknown>) };
  const rawTypes = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
  const types = rawTypes.filter((entry): entry is string => typeof entry === "string");
  if (types.includes("BreadcrumbList") && Array.isArray(node.itemListElement)) {
    node.itemListElement = node.itemListElement.map((element, index) => {
      if (!element || typeof element !== "object") return element;
      const item = element as Record<string, unknown>;
      const name = typeof item.name === "string" && item.name.trim() ? item.name : ctx.title;
      const rawItem = item.item;
      const url = typeof rawItem === "string" ? rawItem
        : rawItem && typeof rawItem === "object" && typeof (rawItem as Record<string, unknown>)["@id"] === "string"
          ? String((rawItem as Record<string, unknown>)["@id"])
          : ctx.url;
      const position = typeof item.position === "number" ? item.position : index + 1;
      return breadcrumbListItem(name, url, position);
    });
  }
  if (types.includes("Article") || types.includes("NewsArticle") || types.includes("BlogPosting")) {
    if (!node.author && ctx.author) node.author = { "@type": "Person", name: ctx.author };
    if (!node.datePublished && ctx.date) node.datePublished = ctx.date;
    if (!node.dateModified && ctx.date) node.dateModified = ctx.date;
    node.headline = ctx.h1;
    // Article without a date is invalid structured data (Marvel /about/,
    // 2026-08-22). Prefer WebPage over an undated Article.
    if (typeof node.datePublished !== "string" && typeof node.dateModified !== "string") {
      node["@type"] = types.length === 1
        ? "WebPage"
        : types.map((type) => (type === "Article" || type === "NewsArticle" || type === "BlogPosting" ? "WebPage" : type));
    }
  }
  if (types.includes("WebPage") && !node.author && ctx.author) {
    node.author = { "@type": "Person", name: ctx.author };
  }
  if (types.includes("WebPage") && !node.dateModified && ctx.date) node.dateModified = ctx.date;
  for (const [key, child] of Object.entries(node)) {
    if (key === "itemListElement") continue;
    node[key] = completeJsonLd(child, ctx);
  }
  return node;
}

// The document wrapper is the only thing every generated site shares: head
// metadata, the inlined stylesheet, the skip link and the runtime client.
// Luban writes the visible page. There is no composition fallback.
/**
 * The config a page component receives. A page holding a client component puts
 * every prop it passes into the visitor's HTML, so the whole config shipped on
 * every page: a tool's work order in the studio's language failed "no cjk
 * characters" on Pomodoro's English site, its acceptance answers went with it,
 * and the home weighed 630KB (2026-11-05). Pages render tools from their
 * inputs and output; the work order and samples stay in lib/site-config.json.
 */
function pageConfig(config: SiteConfig): SiteConfig {
  return {
    ...config,
    toolSpecs: config.toolSpecs?.map((spec) => ({ ...spec, jtbd: spec.title, acceptance: [] })),
    ...(config.runtimeRequirements ? { runtimeRequirements: { ...config.runtimeRequirements, toolPromises: [] } as SiteConfig["runtimeRequirements"] } : {}),
  };
}

export function PageRenderer({ route, content, config, locale }: { route: Route; content: PageContent; config: SiteConfig; locale?: SiteLocale }) {
  const canonicalPath = config.routes.find((r) => r.path === route.path)?.canonical ?? route.path;
  const canonical = absoluteSiteUrl(canonicalPath);
  // hreflang cluster for this page: empty on single-language sites and on
  // pages no locale translated, so those emit no alternate markup at all.
  const alternates = hreflangAlternates(route.path);
  const pageLanguage = locale?.code ?? (config.language || "en");
  const zh = pageLanguage.toLowerCase().startsWith("zh");
  const ogLocale = locale ? ogLocaleFor(locale.code, locale.ogLocale) : ogLocaleFor(config.language || "en");
  const ogLocaleAlternates = [...new Set(alternates
    .filter((alt) => alt.hrefLang !== "x-default")
    .map((alt) => {
      const entry = config.locales?.find((candidate) => candidate.code === alt.hrefLang);
      return entry ? ogLocaleFor(entry.code, entry.ogLocale) : ogLocaleFor(alt.hrefLang);
    })
    .filter((value) => value !== ogLocale))];
  // Locale pages get the primary nav projected into their language; nothing
  // else about the composition contract changes per locale.
  const renderConfig = locale ? { ...config, nav: localeNav(locale), navGroups: localeNavGroups(locale), navMore: localeNavMore(locale) } : config;
  const preview = isPreviewDeployment();
  const deployedVersionId = process.env.NEXT_PUBLIC_SHIPSITE_VERSION_ID ?? "unversioned";
  // Analytics ship only when the owner configured them, never on previews,
  // and only with an id that matches the provider's format — the id lands in
  // executable markup, so anything else is dropped rather than escaped.
  const ga4Id = !preview && config.analytics?.provider === "ga4" && /^G-[A-Z0-9]{4,16}$/.test(config.analytics.id)
    ? config.analytics.id
    : null;
  const plausible = !preview && config.analytics?.provider === "plausible" && /^[a-z0-9.-]{4,80}$/.test(config.analytics.id)
    ? config.analytics.id
    : null;
  // Where the production site reports its statistics (the build fills these):
  // the platform's self-hosted Plausible, loaded from the Plausible host, and
  // the owner's own Google Analytics and Clarity. Never on a preview.
  const tags = preview ? null : config.analyticsTags ?? null;
  const tagPlausible = tags?.plausible && /^https:\/\/[a-z0-9.-]+(?::\d+)?\/js\/script(?:\.[a-z-]+)*\.js$/.test(tags.plausible.src) && /^[a-z0-9][a-z0-9.-]{2,120}$/.test(tags.plausible.domain)
    ? tags.plausible
    : null;
  const tagGa4 = !ga4Id && tags?.ga4 && /^G-[A-Z0-9]{4,16}$/.test(tags.ga4) ? tags.ga4 : null;
  const tagClarity = tags?.clarity && /^[a-z0-9]{6,20}$/.test(tags.clarity) ? tags.clarity : null;
  // Advertising follows the same contract as analytics: owner-configured,
  // never on previews, and only with values matching each network's own
  // format — they land in executable markup, so anything else is dropped
  // rather than escaped.
  const ads = preview ? null : config.ads;
  const adsensePub = ads?.provider === "adsense" && /^pub-\d{16}$/.test(ads.publisherId)
    ? ads.publisherId
    : null;
  // Adsterra/Monetag zone loaders: an exact https .js address (no query or
  // fragment can ride along), plus the numeric zone Monetag binds via
  // data-zone. A value failing either format drops the whole block.
  const zoneScript = (() => {
    if (ads?.provider !== "adsterra" && ads?.provider !== "monetag") return null;
    if (!/^https:\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+\/[\w/.-]{1,200}\.js$/i.test(ads.scriptUrl)) return null;
    if (ads.provider === "monetag" && !/^\d{4,12}$/.test(ads.zoneId)) return null;
    return { src: ads.scriptUrl, zone: ads.provider === "monetag" ? ads.zoneId : null };
  })();
  const NativeInterior = nativeRoutes[normalizeRoutePath(route.path)] ?? nativeRoutes[route.path];
  if (route.coverageMode !== "redirect" && !NativeInterior) {
    throw new Error(`native_route_missing:${route.path}`);
  }
  const interiorOwnsCitations = Boolean((NativeInterior as (typeof NativeInterior & { shipsiteOwnsCitations?: boolean }) | undefined)?.shipsiteOwnsCitations);
  const interiorOwnsPreviewBadge = Boolean((NativeInterior as (typeof NativeInterior & { shipsiteOwnsPreviewBadge?: boolean }) | undefined)?.shipsiteOwnsPreviewBadge);
  // Platform-owned EEAT strip: native interiors often print frozen copy without
  // turning sourceUrl / markdown https into visible outbound <a> anchors, and
  // the rendered-content gate then fails every indexable route
  // (content:eeat-citations). The frozen copy already carries the evidence;
  // this wrapper re-emits unique https citations whose host is not the site.
  const citationHost = (() => {
    try { return new URL(canonical).host; } catch { return ""; }
  })();
  const frozenCitations = frozenCopyCitations(content, citationHost);
  const v = config.visual;
  // Share image: the page's own hero when it has one, else the site-level
  // design render. og:image must be an absolute URL to work anywhere.
  const ogImage = content.hero?.src ?? config.ogImage ?? config.atmosphereBackground ?? config.brandLogo ?? null;
  const fontLinks = config.fontLinks ?? [];
  // The shared motion client script (engine/src/motion-runtime.ts): reveal
  // fallback, stagger arming, count-up. Ships in site-config so renderer and
  // floor pages inline one byte-identical implementation.
  const motionRuntimeScript = config.motionRuntimeScript ?? "";
  const pageTitle = content.title || route.title || content.h1;
  const pageDescription = (content.description || route.description || content.heroText || content.h1).slice(0, 300);
  const synchronizedSchema = synchronizeFaqJsonLd(content.schema, content.faq);
  const faqSchema = content.faq?.length && !synchronizedSchema.hasFaq ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faq.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  } : null;
  // Answer engines resolve who publishes a page and how it sits in the site
  // from explicit schema, not from layout. Site identity (Organization +
  // WebSite) renders exactly once, on the home route; every inner page carries
  // a two-level breadcrumb back to it. All fields come from config/content —
  // the template invents nothing site-specific.
  const isHome = normalizeRoutePath(route.path) === "/";
  const homeUrl = absoluteSiteUrl("/");
  const organizationSchema = isHome ? {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: config.brandName,
    url: homeUrl,
    ...(config.brandLogo ? { logo: absoluteSiteUrl(config.brandLogo) } : {}),
  } : null;
  const websiteSchema = isHome ? {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config.title || config.brandName,
    description: config.description,
    url: homeUrl,
  } : null;
  // named_authors EEAT: about pages often ship an Organization @graph and
  // never a WebPage author, so completeJsonLd cannot stamp Person there
  // (Sida Quiz /about/, 2026-08-24). A dedicated Person block is the
  // identity the content audit looks for on every indexable route.
  const personSchema = config.brandName ? {
    "@context": "https://schema.org",
    "@type": "Person",
    name: config.brandName,
    worksFor: { "@type": "Organization", name: config.brandName, url: homeUrl },
  } : null;
  const homeRoute = config.routes.find((r) => normalizeRoutePath(r.path) === "/");
  const lastChecked = latestCheckedAt(content);
  const jsonLdCtx = {
    title: pageTitle,
    h1: content.h1,
    url: canonical,
    date: lastChecked,
    author: config.brandName || null,
  };
  const breadcrumbSchema = !isHome ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      breadcrumbListItem(homeRoute?.navLabel || config.brandName, homeUrl, 1),
      breadcrumbListItem(pageTitle, canonical, 2),
    ],
  } : null;
  return (
    <html lang={pageLanguage}>
      <head>
        {/* charset, viewport, title and description come from Next metadata
            (generateMetadata, same fallback chain as pageTitle/pageDescription);
            emitting them here too doubled every one of them (2026-10-10). */}
        <meta name="shipsite-version" content={deployedVersionId} />
        <link rel="canonical" href={canonical} />
        {alternates.map((alt) => <link key={alt.hrefLang} rel="alternate" hrefLang={alt.hrefLang} href={alt.href} />)}
        <meta name="robots" content={preview ? "noindex, nofollow" : route.index ? "index, follow" : "noindex, follow"} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content={v?.colors?.background ?? "#0f141a"} />
        {fontLinks.length ? <link rel="preconnect" href="https://fonts.googleapis.com" /> : null}
        {fontLinks.length ? <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /> : null}
        {/* W6-2: preload the font stylesheets so discovery does not wait for
            HTML parse order — the single cheapest FOUT/CLS cut available
            without self-hosting. display=swap already rides in each URL. */}
        {fontLinks.map((href) => <link key={`preload-${href}`} rel="preload" as="style" href={href} />)}
        {fontLinks.map((href) => <link key={href} rel="stylesheet" href={href} />)}
        <meta property="og:site_name" content={config.brandName} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:locale" content={ogLocale} />
        {ogLocaleAlternates.map((value) => <meta key={value} property="og:locale:alternate" content={value} />)}
        {ogImage ? <meta property="og:image" content={absoluteSiteUrl(ogImage)} /> : null}
        <meta name="twitter:card" content={ogImage ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {ogImage ? <meta name="twitter:image" content={absoluteSiteUrl(ogImage)} /> : null}
        <script type="application/ld+json">{JSON.stringify(completeJsonLd(rewritePlaceholderJsonLd(
          isRedundantWebPageSchema(synchronizedSchema.value) ? { "@context": "https://schema.org", "@type": "WebPage", name: content.h1, url: canonical, ...(lastChecked ? { dateModified: lastChecked } : {}) } : (synchronizedSchema.value ?? { "@context": "https://schema.org", "@type": "WebPage", name: content.h1, url: canonical, ...(lastChecked ? { dateModified: lastChecked } : {}) }),
          new URL(canonical).origin,
        ), jsonLdCtx))}</script>
        {faqSchema ? <script type="application/ld+json">{JSON.stringify(rewritePlaceholderJsonLd(faqSchema, new URL(canonical).origin))}</script> : null}
        {organizationSchema ? <script type="application/ld+json">{JSON.stringify(rewritePlaceholderJsonLd(organizationSchema, new URL(canonical).origin))}</script> : null}
        {websiteSchema ? <script type="application/ld+json">{JSON.stringify(rewritePlaceholderJsonLd(websiteSchema, new URL(canonical).origin))}</script> : null}
        {personSchema ? <script type="application/ld+json">{JSON.stringify(rewritePlaceholderJsonLd(personSchema, new URL(canonical).origin))}</script> : null}
        {breadcrumbSchema ? <script type="application/ld+json">{JSON.stringify(rewritePlaceholderJsonLd(breadcrumbSchema, new URL(canonical).origin))}</script> : null}
        {/* PageRenderer owns <head>, so Next never injects app/globals.css.
            Inlining the generated stylesheet is what actually styles the site. */}
        <style dangerouslySetInnerHTML={{ __html: siteStyles }} />
        {/* The site's own recipe, owned by its engineer: after the platform sheet, so it has the last word. */}
        {recipeStyles ? <style dangerouslySetInnerHTML={{ __html: recipeStyles }} /> : null}
        {motionRuntimeScript ? <script dangerouslySetInnerHTML={{ __html: motionRuntimeScript }} /> : null}
        {ga4Id ? (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} />
            <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');` }} />
          </>
        ) : null}
        {plausible ? <script defer data-domain={plausible} src="https://plausible.io/js/script.js" /> : null}
        {tagPlausible ? <script defer data-domain={tagPlausible.domain} src={tagPlausible.src} /> : null}
        {tagPlausible ? <script dangerouslySetInnerHTML={{ __html: "window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)};" }} /> : null}
        {tagGa4 ? (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${tagGa4}`} />
            <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${tagGa4}');` }} />
          </>
        ) : null}
        {tagClarity ? <script dangerouslySetInnerHTML={{ __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${tagClarity}");` }} /> : null}
        {adsensePub ? <meta name="google-adsense-account" content={`ca-${adsensePub}`} /> : null}
        {adsensePub ? <script async crossOrigin="anonymous" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${adsensePub}`} /> : null}
        {zoneScript ? <script async data-cfasync="false" src={zoneScript.src} {...(zoneScript.zone ? { "data-zone": zoneScript.zone } : {})} /> : null}
      </head>
      <body
        data-composition="native-authored"
        data-nav={v?.navigationModel}
        data-density={v?.density}
        data-atmosphere={isHomeRoute(route.path) && config.atmosphereBackground ? "true" : "false"}
        data-texture={config.sectionTexture ? "true" : "false"}
        {...(config.craftExperiment ? { "data-craft": config.craftExperiment } : {})}
        {...(config.visual?.heroComposition ? { "data-hero-composition": config.visual.heroComposition } : {})}
      >
        {isHomeRoute(route.path) && config.atmosphereBackground ? <div className="atmosphere-layer" style={{ backgroundImage: `url(${config.atmosphereBackground})` }} aria-hidden="true" data-asset-role="atmospheric-background" /> : null}
        {/* Tiled decorative texture behind the page. Same inline-style pattern
            as the atmosphere: sanitizeAuthoredCss strips url() from recipeCss,
            so a materialized asset can only reach a background through the
            config channel, never through authored CSS. */}
        {config.sectionTexture ? <div className="texture-layer" style={{ backgroundImage: `url(${config.sectionTexture})` }} aria-hidden="true" data-asset-role="decorative-texture" /> : null}
        <a href="#main" className="skip-link">{zh ? "跳到主要内容" : "Skip to content"}</a>
        {NativeInterior ? <NativeInterior route={route} content={content} config={pageConfig(renderConfig)} /> : null}
        {config.craftExperiment ? null : !interiorOwnsCitations && frozenCitations.length ? (
          <aside className="frozen-citations" aria-label={zh ? "来源" : "Sources"}>
            <p>{zh ? "来源" : "Sources"}</p>
            <ul>
              {frozenCitations.map((citation) => (
                <li key={citation.href}>
                  <a href={citation.href} rel="nofollow noopener" target="_blank">{citation.label}</a>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
        {config.craftExperiment || !lastChecked ? null : (
          <p className="last-checked last-updated">{(config.language ?? "").trim().toLowerCase().startsWith("zh") ? "最近核对：" : "Last checked: "}<time className="last-checked" dateTime={lastChecked}>{lastChecked}</time></p>
        )}
        {renderConfig.runtimeRequirements?.requiresAuth ? (
          <div className="shipsite-account">
            <button type="button" className="bg-accent text-on-accent border-accent hover:opacity-90" data-shipsite-google-login>
              {zh ? "使用 Google 登录" : "Sign in with Google"}
            </button>
          </div>
        ) : null}
        {renderConfig.publicSalesAllowed !== false && renderConfig.runtimeRequirements?.requiresBilling ? (
          <div className="shipsite-billing">
            <button type="button" className="bg-accent text-on-accent border-accent hover:opacity-90" data-shipsite-checkout data-provider="stripe">
              {zh ? "升级" : "Upgrade"}
            </button>
          </div>
        ) : null}
        {preview && !interiorOwnsPreviewBadge ? (
          <div className="preview-badge-wrap">
            <span className="preview-badge">{zh ? "预览版本由 Shipsite.ai 生成，不是正式上线的站点。" : "Preview build generated by Shipsite.ai — not the launched site."}</span>
          </div>
        ) : null}
        <ShipsiteRuntime />
      </body>
    </html>
  );
}
