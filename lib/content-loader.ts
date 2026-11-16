// Build-time content loader — the SERVER-ONLY half of the content data plane.
//
// `next build` with output: "export" renders every page in Node, so reading
// the frozen copy documents off disk is legal here and only here. It lives in
// its own module so ./content can stay client-safe: a "use client" component
// that imports a type or `resolveHref` from ./content must not drag "fs" into
// the browser bundle with it.
//
// Import this module from Server Components only (app/**/page.tsx,
// app/llms.txt/route.ts). Authored route components never call it — the page
// they render inside receives the parsed `content` as a prop.
import { promises as fs } from "fs";
import path from "path";
import type { Route } from "./site-config";
import { normalizeRoutePath } from "./site-config";
import { contentFromRoute, sanitizePageContent, type PageContent } from "./content";

export async function loadPageContent(key: string, route?: Route): Promise<PageContent> {
  const candidates = [key, normalizeRoutePath(route?.path ?? "/").slice(1) || "home"];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const raw = await fs.readFile(path.join(process.cwd(), "content", `${candidate}.json`), "utf-8");
      const parsed = JSON.parse(raw) as PageContent;
      if (parsed && typeof parsed.h1 === "string") return sanitizePageContent(parsed);
    } catch {
      continue;
    }
  }
  return contentFromRoute(route);
}
