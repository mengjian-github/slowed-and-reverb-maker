import rawSiteConfig from "./site-config.json";

export type Route = {
  path: string;
  contentKey: string;
  title: string;
  description: string;
  index: boolean;
  canonical: string;
  navLabel: string;
  routeArchetype?: "home_tool" | "tool" | "article_guide" | "pricing" | "auth" | "account" | "billing" | "purchase_status" | "legal";
  coverageMode?: "direct_screen" | "inherited_template" | "redirect";
  representativeScreenId?: string | null;
  designIrHash?: string | null;
  publicExposure?: boolean;
};

/** One translated page of a secondary locale. `path` is the primary route's
 * own path (the page it translates); the public URL is `/{code}{path}`. */
export type LocaleRoute = {
  path: string;
  contentKey: string;
  title: string;
  description: string;
  index: boolean;
  navLabel: string;
};

/** A secondary language served under the `/{code}/` subpath. The primary
 * language keeps its unprefixed routes; `routes` here are the translated
 * subset, matched to primary pages by path. */
export type SiteLocale = {
  code: string;
  label: string;
  ogLocale?: string;
  routes: LocaleRoute[];
};

export type VisualSystem = {
  layoutArchetype: string;
  navigationModel: string;
  heroComposition: string;
  sectionSequence: string[];
  density: string;
  radiusFamily: string;
  buttonGeometry: string;
  surfaceTreatment: string;
  backgroundTexture: string;
  dataDisplay: string;
  motion: string;
  iconLanguage: string;
  typeScale: number;
  headingWeight: number;
  headingCase: string;
  contentMeasure: number;
  maxWidth: number;
  colors: {
    background: string; surface: string; text: string; accent: string;
    secondary: string;
    gradient?: { angle: number; from: string; to: string };
    font: string; headingFont: string;
  };
  /** Default shaping variant per node type; a node's own variant wins. */
  variantDefaults?: Record<string, string>;
};

// The page this project composed. The renderer walks it; nothing here fixes
// what the tree may contain, so a new kind of page needs no template change.
export type LayoutNode = {
  type: string;
  variant?: string;
  source?: string;
  emphasis?: string;
  span?: number;
  sticky?: boolean;
  collapse?: string;
  mobilePresentation?: "cards" | "scroll" | "priority";
  capability?: string;
  label?: string;
  children?: LayoutNode[];
};

export type CompositionTree = { root: LayoutNode; rationale?: string };

export type AssetPlanEntry = {
  path: string;
  alt: string;
  role: "atmospheric-background" | "hero-subject" | "entity-icon" | "nav-icon" | "section-media" | "gallery-media" | "decorative-texture";
  route?: string | null;
  sectionId?: string | null;
  recordKey?: string | null;
};

/** An acceptance-first tool declaration: what the tool does (jtbd), its
 * declared inputs/output, and executable acceptance samples. Implemented by
 * bespoke "use client" components, never by a shared runner module. */
export type ToolSpec = {
  id: string;
  title: string;
  jtbd: string;
  inputs: {
    id: string;
    kind: "text" | "number" | "select" | "file";
    label: string;
    help?: string;
    placeholder?: string;
    required?: boolean;
    multiline?: boolean;
    options?: { value: string; label: string }[];
  }[];
  output: { label: string; description?: string };
  acceptance: {
    id: string;
    expectedState?: "success" | "error";
    setup?: { toolId: string; acceptanceId: string }[];
    given: Record<string, string>;
    expect: { kind: string; fields?: string[]; value?: string }[];
  }[];
  execution: "client" | "server";
  privacy: "in-browser" | "upload-ephemeral";
  privacyNote: string;
};

export type SiteConfig = {
  title: string;
  description: string;
  brandName: string;
  domain: string;
  language: string;
  /** Secondary languages under `/{code}/`; absent or [] renders the exact
   * single-language site with no alternate markup at all. */
  locales?: SiteLocale[];
  recipeId?: string | null;
  /** Owner-configured analytics; null ships no tracking at all. */
  analytics?: { provider: "ga4" | "plausible"; id: string } | null;
  /** Statistics the production site reports to: the platform's self-hosted
   * Plausible (loaded from the Plausible host, never from the platform) and
   * the owner's own Google Analytics and Microsoft Clarity. */
  analyticsTags?: { plausible?: { src: string; domain: string }; ga4?: string; clarity?: string } | null;
  /** Owner-configured advertising; null ships no ad code and no ads.txt. */
  ads?:
    | { provider: "adsense"; publisherId: string; adsTxtExtra?: string[] }
    | { provider: "adsterra"; scriptUrl: string; adsTxtExtra?: string[] }
    | { provider: "monetag"; scriptUrl: string; zoneId: string; adsTxtExtra?: string[] }
    | null;
  routes: Route[];
  nav: { label: string; href: string }[];
  /** Real parent → children dropdowns. Never a More dump. */
  navGroups?: { label: string; items: { label: string; href: string }[] }[];
  /** @deprecated Always empty. Leftovers belong in footerGroups. */
  navMore?: { label: string; href: string }[];
  /** Build-time nav marks (24x24 path data), keyed by href; empty or absent
   * for legacy contracts and iconLanguage "none". */
  navIcons?: Record<string, { d: string; filled: boolean }>;
  /** Build-time section-scale marks (24x24 path data), keyed by the exact
   * rendered title (section h2, card item, step item). Same gating as
   * navIcons; titles with no semantic match are absent — the renderer draws
   * nothing for a miss. */
  sectionIcons?: Record<string, { d: string; filled: boolean }>;
  design: {
    background: string;
    surface: string;
    text: string;
    accent: string;
    font: string;
  };
  visual: VisualSystem;
  composition?: CompositionTree;
  routeCompositions?: Record<string, CompositionTree>;
  qualityContractVersion?: "site-factory-v2.1@2.1.0" | null;
  /** Acceptance-first tool declarations. There is no platform runner for
   * these: native-authored components implement each spec's jtbd as
   * in-browser computation, and QA replays the acceptance samples against
   * the rendered tool. Absent on capability-era configs. */
  toolSpecs?: ToolSpec[];
  /** Pricing release authority, separate from required product capabilities. */
  publicSalesAllowed?: boolean;
  runtimeRequirements?: {
    requiresCapability: boolean;
    requiredCapabilityOperations: string[];
    requiresAuth: boolean;
    requiresBilling: boolean;
  };
  runtimeCapabilityTruth?: {
    executableCapabilityIds: string[];
    authE2E: boolean;
    billingE2E: boolean;
    /** WORKER_REQUIRED sites run the generated backend Worker and exchange the
     *  platform session against their own /api/auth/session; absent/STATIC_ONLY
     *  sites keep every runtime action (login, checkout) on the platform. */
    backendMode?: "STATIC_ONLY" | "WORKER_REQUIRED";
  };
  fontLinks?: string[];
  /** The shared motion client script source; rendered once per page as an
   *  inline script. Absent on legacy configs, which ship no script at all. */
  motionRuntimeScript?: string | null;
  ogImage?: string | null;
  brandLogo?: string | null;
  atmosphereBackground?: string | null;
  sectionTexture?: string | null;
  assetPlan?: AssetPlanEntry[];
  footerGroups?: { title: string; links: { label: string; href: string }[] }[];
  footerNote?: string | null;
  /** The site's own domain mailbox (hello@domain), set at build once it is live; null before launch. */
  contactEmail?: string | null;
  /** Plan-derived at build time: Free-plan sites render the "Made with
   * ShipSite.ai" footer link, paid plans never do. Not owner-editable. */
  attribution?: boolean;
  /** Present only on the Starter Feeding craft experiment. */
  craftExperiment?: "starter-feeding" | "atelier";
};

export const siteConfig = rawSiteConfig as unknown as SiteConfig;

// Route paths are compared after normalization. The catch-all segment array
// never carries a trailing slash, while route contracts frequently do
// ("/how-to-redeem/"), so a raw equality check silently 404s every inner page.
export function normalizeRoutePath(path: string): string {
  const trimmed = (path || "/").trim();
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const withoutTrailing = withLeading.replace(/\/+$/, "");
  return withoutTrailing || "/";
}

export function findRoute(path: string): Route | undefined {
  const target = normalizeRoutePath(path);
  return siteConfig.routes.find((route) => normalizeRoutePath(route.path) === target);
}

export function siteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Fall through to the contract domain when the build-time override is invalid.
    }
  }
  return `https://${siteConfig.domain}`;
}

/** Preview workers.dev builds must never look indexable. Production is the
 *  workflow's explicit NEXT_PUBLIC_BUILD_ENV=production compile, not a
 *  contract-domain heuristic. */
export function isPreviewDeployment(): boolean {
  return process.env.NEXT_PUBLIC_BUILD_ENV !== "production";
}

export function absoluteSiteUrl(path: string): string {
  let pathname = path || "/";
  try {
    pathname = new URL(path).pathname;
  } catch {
    if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  }
  return new URL(pathname, `${siteOrigin()}/`).toString();
}

// ---------------------------------------------------------------------------
// Locales. Every helper below returns its empty value when the config carries
// no locales, so a single-language site renders byte-identical markup.

export function siteLocales(): SiteLocale[] {
  return siteConfig.locales ?? [];
}

/** Public URL path of a locale page, in the exported trailing-slash spelling
 * the engine normalizes canonicals to ("/es/", "/es/pricing/"). */
export function localePublicPath(code: string, basePath: string): string {
  const base = normalizeRoutePath(basePath);
  return base === "/" ? `/${code}/` : `/${code}${base}/`;
}

/** Split a public URL path into the locale owning it (when its first segment
 * names a configured locale) and the primary-route-relative remainder. */
export function splitLocalePath(path: string): { locale: SiteLocale | null; basePath: string } {
  const segments = normalizeRoutePath(path).split("/").filter(Boolean);
  const locale = segments.length ? siteLocales().find((entry) => entry.code === segments[0]) ?? null : null;
  if (!locale) return { locale: null, basePath: normalizeRoutePath(path) };
  return { locale, basePath: normalizeRoutePath(`/${segments.slice(1).join("/")}`) };
}

export type ResolvedRoute = { route: Route; locale: SiteLocale | null };

/** Resolve a public URL path to a renderable route: primary routes as-is,
 * locale routes materialized with their public `/{code}/...` path. */
export function resolveRoute(path: string): ResolvedRoute | null {
  const { locale, basePath } = splitLocalePath(path);
  if (!locale) {
    const route = findRoute(path);
    return route ? { route, locale: null } : null;
  }
  const localeRoute = locale.routes.find((route) => normalizeRoutePath(route.path) === basePath);
  if (!localeRoute) return null;
  const publicPath = localePublicPath(locale.code, basePath);
  return {
    locale,
    route: {
      path: publicPath,
      contentKey: localeRoute.contentKey,
      title: localeRoute.title,
      description: localeRoute.description,
      index: localeRoute.index,
      canonical: publicPath,
      navLabel: localeRoute.navLabel,
    },
  };
}

export type HreflangAlternate = { hrefLang: string; href: string };

/** The bidirectional hreflang cluster for a public path: the primary page,
 * every locale that translated it, and x-default on the primary. Empty for
 * single-language sites and for pages no locale translated, so those pages
 * emit no alternate markup at all. */
export function hreflangAlternates(path: string): HreflangAlternate[] {
  const locales = siteLocales();
  if (!locales.length) return [];
  const { basePath } = splitLocalePath(path);
  const primary = findRoute(basePath);
  if (!primary) return [];
  const translated = locales.filter((entry) => entry.routes.some((route) => normalizeRoutePath(route.path) === basePath));
  if (!translated.length) return [];
  const primaryHref = absoluteSiteUrl(primary.canonical || primary.path);
  return [
    { hrefLang: siteConfig.language || "en", href: primaryHref },
    ...translated.map((entry) => ({ hrefLang: entry.code, href: absoluteSiteUrl(localePublicPath(entry.code, basePath)) })),
    { hrefLang: "x-default", href: primaryHref },
  ];
}

const OG_LOCALE_BY_LANGUAGE: Record<string, string> = { en: "en_US", zh: "zh_CN", es: "es_ES", ja: "ja_JP", de: "de_DE", pt: "pt_PT" };

/** og:locale for a language code; an explicit contract override wins. */
export function ogLocaleFor(code: string, override?: string): string {
  if (override) return override;
  const language = code.trim().toLowerCase().split(/[-_]/)[0] || "en";
  return OG_LOCALE_BY_LANGUAGE[language] ?? `${language}_${language.toUpperCase()}`;
}

const LANGUAGE_LABELS: Record<string, string> = { en: "English", zh: "中文", es: "Español", ja: "日本語", de: "Deutsch", pt: "Português" };

/** Self-named label for the primary language (locales carry their own). */
export function languageLabel(code: string): string {
  const language = code.trim().toLowerCase().split(/[-_]/)[0];
  return LANGUAGE_LABELS[language] ?? code.toUpperCase();
}

export type LocaleSwitchLink = { code: string; label: string; href: string; current: boolean };

/** Footer language switcher: each language links the current page's own
 * translation when one exists and that language's homepage when it does not.
 * Empty on single-language sites so nothing renders. */
export function languageSwitcherLinks(path: string): LocaleSwitchLink[] {
  const locales = siteLocales();
  if (!locales.length) return [];
  const { locale: current, basePath } = splitLocalePath(path);
  const primary = findRoute(basePath);
  const primaryCode = siteConfig.language || "en";
  return [
    { code: primaryCode, label: languageLabel(primaryCode), href: primary ? (primary.canonical || primary.path) : "/", current: !current },
    ...locales.map((entry) => ({
      code: entry.code,
      label: entry.label || languageLabel(entry.code),
      href: entry.routes.some((route) => normalizeRoutePath(route.path) === basePath)
        ? localePublicPath(entry.code, basePath)
        : localePublicPath(entry.code, "/"),
      current: current?.code === entry.code,
    })),
  ];
}

/** Project a nav list into a locale: items whose target the locale
 * translated link the `/{code}/` path under the locale's own navLabel; items
 * without a translation keep their primary href and label. */
function projectNav(
  locale: SiteLocale,
  items: readonly { label: string; href: string }[],
): { label: string; href: string }[] {
  return items.map((item) => {
    if (!item.href.startsWith("/")) return item;
    const base = normalizeRoutePath(item.href);
    const translated = locale.routes.find((route) => normalizeRoutePath(route.path) === base);
    return translated ? { label: translated.navLabel || item.label, href: localePublicPath(locale.code, base) } : item;
  });
}

export function localeNav(locale: SiteLocale): { label: string; href: string }[] {
  return projectNav(locale, siteConfig.nav);
}

export function localeNavGroups(locale: SiteLocale): { label: string; items: { label: string; href: string }[] }[] {
  return (siteConfig.navGroups ?? []).map((group) => ({
    label: group.label,
    items: projectNav(locale, group.items),
  }));
}

export function localeNavMore(locale: SiteLocale): { label: string; href: string }[] {
  return projectNav(locale, siteConfig.navMore ?? []);
}
