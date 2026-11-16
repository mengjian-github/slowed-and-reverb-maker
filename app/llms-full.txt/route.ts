import { absoluteSiteUrl, siteConfig } from "../../lib/site-config";
import { loadPageContent } from "../../lib/content-loader";

export const dynamic = "force-static";

// llms-full.txt (llmstxt.org): every indexable page's own words as markdown,
// so an answer engine can quote the site without rendering it. Same routes
// and the same frozen copy as llms.txt and the sitemap; nothing is written
// here that the page does not already say.
function inline(text: string | undefined | null): string {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

export async function GET(): Promise<Response> {
  const routes = siteConfig.routes.filter((route) => route.index !== false);
  const pages = await Promise.all(routes.map(async (route) => {
    const content = await loadPageContent(route.contentKey, route);
    const lines: string[] = [`# ${inline(content.h1 || content.title || route.title)}`, "", `Source: ${absoluteSiteUrl(route.path)}`, ""];
    if (inline(content.heroText)) lines.push(inline(content.heroText), "");
    for (const section of content.sections ?? []) {
      if (inline(section.title)) lines.push(`## ${inline(section.title)}`, "");
      if (inline(section.body)) lines.push(inline(section.body), "");
      for (const item of section.items ?? []) lines.push(`- ${inline(item.title)}${inline(item.body) ? `: ${inline(item.body)}` : ""}`);
      for (const step of section.steps ?? []) lines.push(`- ${inline(step.title)}${inline(step.body) ? `: ${inline(step.body)}` : ""}`);
      if ((section.items ?? []).length || (section.steps ?? []).length) lines.push("");
    }
    if ((content.faq ?? []).length) {
      lines.push(siteConfig.language?.toLowerCase().startsWith("zh") ? "## 常见问题" : "## FAQ", "");
      for (const entry of content.faq ?? []) lines.push(`### ${inline(entry.question)}`, "", inline(entry.answer), "");
    }
    return lines.join("\n");
  }));
  const body = [`# ${inline(siteConfig.brandName)}`, "", `> ${inline(siteConfig.description)}`, "", ...pages].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
