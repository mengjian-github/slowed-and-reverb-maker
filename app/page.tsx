import type { Metadata } from "next";
import { siteConfig, findRoute, isPreviewDeployment } from "@/lib/site-config";
import { loadPageContent } from "@/lib/content-loader";
import { PageRenderer } from "@/components/PageRenderer";

const homeRoute = findRoute("/") ?? siteConfig.routes[0];

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadPageContent(homeRoute.contentKey, homeRoute);
  return {
    // The same chain PageRenderer uses for pageTitle/pageDescription.
    title: content.title || homeRoute.title || content.h1,
    description: (content.description || homeRoute.description || content.heroText || content.h1).slice(0, 300),
    robots: isPreviewDeployment()
      ? { index: false, follow: false }
      : { index: homeRoute.index, follow: true },
  };
}

export default async function HomePage() {
  const content = await loadPageContent(homeRoute.contentKey, homeRoute);
  return <PageRenderer route={homeRoute} content={content} config={siteConfig} />;
}
