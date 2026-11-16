import type { MetadataRoute } from "next";
import { absoluteSiteUrl, localePublicPath, normalizeRoutePath, siteConfig } from "../lib/site-config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const primary: MetadataRoute.Sitemap = siteConfig.routes.filter((route) => route.index !== false).map((route) => ({
    url: absoluteSiteUrl(route.path === "/" ? "/" : route.path),
    changeFrequency: route.path === "/" ? "weekly" : "monthly",
    priority: route.path === "/" ? 1 : 0.7,
  }));
  // Locale pages ship in the same sitemap under their public /{code}/ paths;
  // a site without locales contributes nothing here.
  const locales: MetadataRoute.Sitemap = (siteConfig.locales ?? []).flatMap((locale) =>
    locale.routes.filter((route) => route.index !== false).map((route) => ({
      url: absoluteSiteUrl(localePublicPath(locale.code, route.path)),
      changeFrequency: normalizeRoutePath(route.path) === "/" ? "weekly" as const : "monthly" as const,
      priority: normalizeRoutePath(route.path) === "/" ? 0.8 : 0.6,
    })));
  return [...primary, ...locales];
}
