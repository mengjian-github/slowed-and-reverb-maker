import { absoluteSiteUrl, siteConfig } from "../../lib/site-config";
import { loadPageContent } from "../../lib/content-loader";

export const dynamic = "force-static";

// llms.txt (https://llmstxt.org): a compact markdown map AI answer engines
// read before deciding what to cite. Same source of truth and same route
// filter as sitemap.ts — the route contract plus the frozen copy — so what an
// answer engine reads is exactly what the site already says about itself, on
// the same origin the sitemap advertises. Deliberately primary-language only:
// locale pages are translations of these same pages, and hreflang (not this
// map) is how engines pick the language variant.
function inline(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export async function GET(): Promise<Response> {
  const routes = siteConfig.routes.filter((route) => route.index !== false);
  const pages = await Promise.all(routes.map(async (route) => {
    const content = await loadPageContent(route.contentKey, route);
    const title = inline(content.title || route.title || content.h1);
    // Mirrors the meta-description precedence in PageRenderer, so the answer
    // engine sees the same one-liner a search snippet would.
    const description = inline(content.description || route.description || content.heroText || content.h1).slice(0, 300);
    return `- [${title}](${absoluteSiteUrl(route.path)})${description ? `: ${description}` : ""}`;
  }));
  const zh = (siteConfig.language || "").toLowerCase().startsWith("zh");
  const body = [
    `# ${inline(siteConfig.brandName)}`,
    "",
    `> ${inline(siteConfig.description)}`,
    "",
    zh ? "## 页面" : "## Pages",
    "",
    ...pages,
    "",
    zh ? "## 可选" : "## Optional",
    "",
    `- [${zh ? "全部页面正文" : "Full text of every page"}](${absoluteSiteUrl("/llms-full.txt")})`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
