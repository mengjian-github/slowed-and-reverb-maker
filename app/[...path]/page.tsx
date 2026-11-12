import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig, resolveRoute, normalizeRoutePath, localePublicPath, isPreviewDeployment } from "@/lib/site-config";
import { loadPageContent } from "@/lib/content-loader";
import { PageRenderer } from "@/components/PageRenderer";

type Params = { path: string[] };

export async function generateStaticParams() {
  // Primary inner pages plus every locale page. The locale homepage is an
  // inner path here ("/es/" -> ["es"]), so it is never filtered out.
  const primary = siteConfig.routes
    .filter((r) => normalizeRoutePath(r.path) !== "/")
    .map((r) => ({ path: r.path.split("/").filter(Boolean) }));
  const locales = (siteConfig.locales ?? []).flatMap((locale) =>
    locale.routes.map((r) => ({ path: localePublicPath(locale.code, r.path).split("/").filter(Boolean) })));
  return [...primary, ...locales];
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { path } = await params;
  const resolved = resolveRoute("/" + (path?.join("/") ?? ""));
  const route = resolved?.route;
  const content = route ? await loadPageContent(route.contentKey, route) : null;
  return {
    // The same chain PageRenderer uses for pageTitle/pageDescription.
    title: content?.title || route?.title || content?.h1 || siteConfig.title,
    description: (content?.description || route?.description || content?.heroText || content?.h1 || siteConfig.description || "").slice(0, 300),
    // Next injects this as the first <meta name="robots">. PageRenderer also
    // emits one. They must agree: a preview that leads with index,follow fails
    // tech-seo (QA reads the first tag) and can leak a preview into the index.
    robots: isPreviewDeployment()
      ? { index: false, follow: false }
      : { index: route?.index ?? true, follow: true },
  };
}

export default async function CatchAllPage({ params }: { params: Promise<Params> }) {
  const { path } = await params;
  const resolved = resolveRoute("/" + (path?.join("/") ?? ""));
  if (!resolved) return notFound();
  const content = await loadPageContent(resolved.route.contentKey, resolved.route);
  return <PageRenderer route={resolved.route} content={content} config={siteConfig} locale={resolved.locale ?? undefined} />;
}
