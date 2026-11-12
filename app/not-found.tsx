import { siteConfig } from "@/lib/site-config";
import { siteStyles } from "@/lib/site-styles";
import { recipeStyles } from "@/components/native/recipe-styles";

// Why this file exists at all.
//
// The generated site's root layout returns `children` untouched: PageRenderer
// owns <html>/<head> so every authored route can carry its own metadata. That
// works for every route the engine writes — and left exactly one hole. Next's
// built-in not-found page is NOT an authored route: with no app/not-found.tsx
// it renders Next's own minimal <div> shell, which never emits <html> at all.
// `output: "export"` then writes that shell to dist/404.html, dist/404/index.html
// and dist/_not-found/index.html, and axe reports `html-has-lang (serious)` on
// /404/ and /_not-found/ for EVERY generated site — a defect no source patch
// can reach, because the routes have no source file and the shell is pinned.
// Evidence (2026-08-13): prj_3c0d368f-7e0 and prj_464d82e0-ccd each burned
// three gate rounds on this pair and could never have converged.
//
// So the not-found page renders the full document itself, exactly as
// PageRenderer does, with the site's own language on <html>.
//
// This file is a pinned platform shell (shared/source-patch.ts): route
// authoring must never rewrite it.

type NotFoundCopy = { title: string; heading: string; body: string; home: string; skip: string };

// The primary language is en or zh; the secondary locales the platform mounts
// under /{code}/ (shared/site-locales.ts) are covered too so a visitor who
// mistypes a localized URL is not answered in a language the site never uses.
// Anything else falls back to English rather than shipping a wrong-language page.
const NOT_FOUND_COPY: Record<string, NotFoundCopy> = {
  en: { title: "Page not found", heading: "Page not found", body: "The page you asked for does not exist or has moved.", home: "Back to home", skip: "Skip to content" },
  zh: { title: "页面不存在", heading: "页面不存在", body: "你访问的页面不存在，或者已经移动到别处。", home: "返回首页", skip: "跳到主要内容" },
  es: { title: "Página no encontrada", heading: "Página no encontrada", body: "La página que buscas no existe o se ha movido.", home: "Volver al inicio", skip: "Saltar al contenido" },
  ja: { title: "ページが見つかりません", heading: "ページが見つかりません", body: "お探しのページは存在しないか、移動しました。", home: "ホームに戻る", skip: "本文へスキップ" },
  de: { title: "Seite nicht gefunden", heading: "Seite nicht gefunden", body: "Die gesuchte Seite existiert nicht oder wurde verschoben.", home: "Zurück zur Startseite", skip: "Zum Inhalt springen" },
  pt: { title: "Página não encontrada", heading: "Página não encontrada", body: "A página que você procura não existe ou foi movida.", home: "Voltar ao início", skip: "Ir para o conteúdo" },
  fr: { title: "Page introuvable", heading: "Page introuvable", body: "La page demandée n'existe pas ou a été déplacée.", home: "Retour à l'accueil", skip: "Aller au contenu" },
  ko: { title: "페이지를 찾을 수 없습니다", heading: "페이지를 찾을 수 없습니다", body: "요청하신 페이지가 없거나 다른 곳으로 옮겨졌습니다.", home: "홈으로 돌아가기", skip: "본문으로 건너뛰기" },
};

// axe checks html-lang-valid as well as html-has-lang, so an unusable value in
// the stored config must not reach the attribute: fall back to English rather
// than emit a tag no BCP-47 parser accepts.
function documentLanguage(raw: string): string {
  const value = (raw || "").trim();
  return /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(value) ? value : "en";
}

function notFoundCopy(language: string): NotFoundCopy {
  const base = language.toLowerCase().split("-")[0];
  return NOT_FOUND_COPY[base] ?? NOT_FOUND_COPY.en;
}

// Without this, Next injects the root layout's platform-default metadata
// ("Shipsite Generated Site") into the 404 document — the one page of a
// customer's site that would name the factory instead of the brand. Every
// authored route overrides it through generateMetadata; this route has none.
export const metadata = {
  title: `${notFoundCopy(documentLanguage(siteConfig.language)).title} — ${siteConfig.brandName}`,
  description: notFoundCopy(documentLanguage(siteConfig.language)).body,
};

export default function NotFound() {
  const language = documentLanguage(siteConfig.language);
  const copy = notFoundCopy(language);
  return (
    <html lang={language}>
      <head>
        <meta charSet="utf-8" />
        <title>{`${copy.title} — ${siteConfig.brandName}`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* A 404 is never indexable; links on it still are. */}
        <meta name="robots" content="noindex, follow" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {/* Same inlining contract as PageRenderer: this document owns <head>,
            so the engine stylesheet only reaches the page from here. Without
            it the 404 renders unstyled and its colors are not the enforced
            token pair axe measures for contrast. */}
        <style dangerouslySetInnerHTML={{ __html: siteStyles }} />
        {recipeStyles ? <style dangerouslySetInnerHTML={{ __html: recipeStyles }} /> : null}
      </head>
      <body>
        <a href="#main" className="skip-link">{copy.skip}</a>
        {/* A designed dead end (designspells' 404 category): the brand, one
            oversized numeral in the site's own type, the way home as the
            site's primary button, and the site's own pages as the way on —
            never a bare line of text that reads as a broken site. */}
        <main id="main" style={{ maxWidth: "var(--max)", minHeight: "100vh", margin: "0 auto", padding: "var(--pad-block) var(--pad-inline)", display: "flex", flexDirection: "column", justifyContent: "center", gap: "1rem" }}>
          <a href="/" style={{ color: "var(--text)", fontWeight: 700, textDecoration: "none" }}>{siteConfig.brandName}</a>
          <p aria-hidden="true" style={{ margin: "1rem 0 0", fontSize: "calc(var(--type-display) * 1.8)", fontWeight: 700, lineHeight: 0.9, letterSpacing: "var(--type-display-tracking)", color: "var(--accent-ink)" }}>404</p>
          <h1>{copy.heading}</h1>
          <p style={{ margin: 0, color: "var(--text-muted)", maxWidth: "36rem" }}>{copy.body}</p>
          <div className="ctas">
            <a href="/" className="primary">{copy.home}</a>
          </div>
          {siteConfig.nav.filter((item) => item.href !== "/").length > 0 ? (
            <nav aria-label={copy.heading}>
              <ul style={{ listStyle: "none", padding: 0, margin: "1rem 0 0", display: "flex", flexWrap: "wrap", gap: "0.5rem 1.25rem" }}>
                {siteConfig.nav.filter((item) => item.href !== "/").slice(0, 6).map((item) => (
                  <li key={item.href}><a href={item.href} style={{ color: "var(--accent-ink)" }}>{item.label}</a></li>
                ))}
              </ul>
            </nav>
          ) : null}
        </main>
      </body>
    </html>
  );
}
