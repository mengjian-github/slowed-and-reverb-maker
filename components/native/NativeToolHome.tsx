"use client";

import { useState } from "react";
import type { Route, SiteConfig } from "@/lib/site-config";
import type { PageContent } from "@/lib/content";

// The floor's own prop types, from the platform data contract — never from
// registry.tsx, which an authoring or repair agent may rewrite with its own
// looser types (AI Video Summary's build check, TS2339 on hero.credit, 2026-10-12).
type NativeRouteProps = { route: Route; content: PageContent; config: SiteConfig };
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
import { VideoEmbed } from "@/components/VideoEmbed";

function richText(value: string | undefined) {
  const text = value ?? "";
  const nodes: Array<string | { href: string; label: string; external: boolean } | { strong: string }> = [];
  const pattern = /\[([^\]]+)\]\(([^)]*)\)|\*\*([^*]+)\*\*|__([^_]+)__/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    if (match[1] !== undefined) {
      const href = match[2].trim();
      const external = /^https:\/\//i.test(href);
      const safe = external || href.startsWith("/");
      if (safe) nodes.push({ href, label: match[1], external });
      else nodes.push(match[1]);
    } else {
      nodes.push({ strong: match[3] || match[4] });
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes.map((node, index) => {
    if (typeof node === "string") return node;
    if ("href" in node) {
      return <a key={index} href={node.href} {...(node.external ? { rel: "nofollow noopener", target: "_blank" } as const : {})}>{node.label}</a>;
    }
    return <strong key={index}>{node.strong}</strong>;
  });
}

function visitorChromeLang(config: NativeRouteProps["config"], content: NativeRouteProps["content"]) {
  const declared = String(config.language ?? "en").toLowerCase();
  if (/^(zh|it|es|fr|de|pt|ja|ko)/.test(declared)) return declared.slice(0, 2);
  const blob = String(content.h1 ?? "") + " " + String(content.heroText ?? "");
  if (/[一-鿿]/.test(blob)) return "zh";
  if (/[àèéìòù]|\b(patente|esame|fonti|questa|che cos)/i.test(blob)) return "it";
  return "en";
}

function localizeChrome(text: string, lang: string) {
  const key = String(text ?? "").trim().toLowerCase();
  const it: Record<string, string> = {
    "quiz type": "Tipo di quiz",
    "topic": "Argomento",
    "driving-theory topic": "Argomento di teoria",
    "driving theory topic": "Argomento di teoria",
    "topic practice": "Esercizio per argomento",
    "mock exam": "Simulazione d'esame",
    "road signs": "Segnali stradali",
    "right of way": "Precedenza",
    "safety and behaviour": "Sicurezza e comportamento",
    "safety and behavior": "Sicurezza e comportamento",
    "score": "Punteggio",
    "run": "Avvia",
    "start quiz": "Inizia il quiz",
    "pick a type and topic, then start.": "Scegli tipo e argomento, poi inizia.",
  };
  if (lang === "it") return it[key] || text;
  return text;
}

function usableToolSrc(src: string | undefined) {
  const value = String(src ?? "").trim();
  if (!value || /\/images\/slots\//i.test(value) || /\/images\/entities\//i.test(value)) return "";
  return value;
}

function toolHomeMedia(content: NativeRouteProps["content"], config: NativeRouteProps["config"]) {
  const citations = new Set([content.hero, ...(content.gallery ?? []), ...(content.sections ?? []).map((section) => section.image)]
    .filter((image) => image?.fit === "contain").map((image) => String(image?.src ?? "")));
  const seen = new Set<string>();
  const out: Array<{ src: string; alt: string }> = [];
  const add = (src: string | undefined, alt?: string) => {
    const value = usableToolSrc(src);
    if (!value || seen.has(value) || citations.has(value)) return;
    seen.add(value);
    out.push({ src: value, alt: alt || "" });
  };
  add(content.hero?.src, content.hero?.alt);
  for (const image of content.gallery ?? []) add(image.src, image.alt);
  for (const section of content.sections ?? []) add(section.image?.src, section.image?.alt);
  for (const asset of config.assetPlan ?? []) {
    if (!/hero-subject|gallery-media|section-media/.test(String(asset.role ?? ""))) continue;
    add(asset.path, asset.alt);
  }
  return out.slice(0, 8);
}

const SECTION_RHYTHM: number[] = [1,2,1,0,0,0];
const HERO_BAND = true;
const TICKER = true;

export default function NativeToolHome(props: any) {
  const { route, content, config } = props as NativeRouteProps;
  const spec = (config.toolSpecs ?? [])[0] ?? null;
  const capId = spec?.id || "home-tool";
  const specInputs = spec?.inputs ?? [];
  // Spot visuals for the tool-home floor (owner design review, 2026-10-12): a text-only
  // section whose title has a mark in config.sectionIcons gets it as a spot tile,
  // alternating sides; a card list shows marks only when every card has one.
  const glyphOf = (title: unknown) => config.sectionIcons?.[String(title ?? "")] ?? null;
  const glyphSvg = (title: unknown, className: string) => {
    const glyph = glyphOf(title);
    if (!glyph) return null;
    return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...(glyph.filled ? { fill: "currentColor" } : { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const })}><path d={glyph.d} /></svg>;
  };
  const spotted = (_section: { title?: string; items?: unknown[]; table?: unknown; video?: unknown }) => false;
  const listGlyphs = (items: { title?: string }[] | undefined) => Boolean(items?.length) && (items ?? []).every((item) => Boolean(glyphOf(item.title)));
  const quizShaped = /quiz|topic|exam|question|patente|driving.?theor/i.test([spec?.id, spec?.title, spec?.jtbd, ...specInputs.map((input) => input.id + " " + input.label)].join(" "));
  const shape = quizShaped ? "quiz" : "form";
  const lang = visitorChromeLang(config, content);
  const runLabel = quizShaped
    ? (lang.startsWith("zh") ? "开始测验" : lang.startsWith("it") ? "Inizia il quiz" : "Start quiz")
    : (spec?.output?.label && !/^score$/i.test(spec.output.label) && spec.output.label.trim().split(/\s+/).length <= 3 && !/machine|json|summary/i.test(spec.output.label) ? spec.output.label
      : /generat|生成/i.test([spec?.id, spec?.title].join(" ")) ? (lang.startsWith("zh") ? "生成" : lang.startsWith("it") ? "Genera" : "Generate")
      : lang.startsWith("zh") ? "运行" : lang.startsWith("it") ? "Avvia" : "Run");
  const idleHint = quizShaped
    ? (lang.startsWith("zh") ? "选择类型和主题后开始。" : lang.startsWith("it") ? "Scegli tipo e argomento, poi inizia." : "Pick a type and topic, then start.")
    : (lang.startsWith("zh") ? "填写后运行。" : lang.startsWith("it") ? "Compila i campi, poi avvia." : "Fill the fields, then run.");
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const input of specInputs) {
      initial[input.id] = input.kind === "select" ? input.options?.[0]?.value ?? "" : "";
    }
    return initial;
  });
  const unavailable = lang.startsWith("zh") ? "此工具尚未实现，请稍后再试。" : lang.startsWith("it") ? "Questo strumento non è ancora disponibile. Riprova più tardi." : "This tool is not available yet. Please try again later.";
  const [specState, setSpecState] = useState<"idle" | "working" | "success" | "error">("idle");
  const updateValue = (id: string, value: string) => {
    setValues((previous) => ({ ...previous, [id]: value }));
  };
  const lastChecked = (() => {
    const candidates: string[] = [];
    const add = (value: unknown) => {
      if (typeof value === "string") {
        const match = value.match(/\d{4}-\d{2}-\d{2}/);
        if (match) candidates.push(match[0]);
      }
    };
    add(content.heroText);
    add((content.schema as { dateModified?: string; datePublished?: string } | undefined)?.dateModified);
    add((content.schema as { dateModified?: string; datePublished?: string } | undefined)?.datePublished);
    for (const section of content.sections ?? []) {
      add(section.body);
      add(section.table?.lastCheckedAt);
      for (const row of section.table?.rows ?? []) add(row.observedAt);
    }
    if (!candidates.length) {
      const nested = JSON.stringify(content).match(/\d{4}-\d{2}-\d{2}/g) ?? [];
      candidates.push(...nested);
    }
    candidates.sort();
    return candidates.at(-1) ?? null;
  })();
  const toolMedia = toolHomeMedia(content, config);
  const hasPricing = (config.routes ?? []).some((entry) => /\/(?:pricing|plans)\/?$/i.test(String(entry.path ?? "")));
  const ctas = (content.ctas ?? []).filter((cta) => cta.action !== "google_login" && (cta.action !== "checkout" || (hasPricing && config.publicSalesAllowed !== false)));
  return (
    <div className="site-shell" data-page-kind="tool">
      <SiteHeader config={config} locales={config.locales ?? []} currentPath={route.path} />
      <main id="main">
        {HERO_BAND ? (
          <section className="hero eyebrow-band-hero" data-hero-variant="eyebrow-band">
            {content.eyebrow ? <span className="eyebrow">{content.eyebrow}</span> : null}
            <h1>{content.h1}</h1>
            {content.heroText ? <p className="lead">{richText(content.heroText)}</p> : null}
          </section>
        ) : null}
        {TICKER ? (
          <div className="ticker-band" data-motion="marquee" aria-hidden="true">
            <div className="ticker-track">
              {[...Array(16)].map((run) => (
                <span key={run} className="ticker-run">{config.brandName}{content.eyebrow ? ` — ${content.eyebrow}` : ""} · </span>
              ))}
            </div>
          </div>
        ) : null}
        <div className="tool-home-stage" data-hero-variant="eyebrow-band">
        <section className="capability" data-capability={capId} data-operation="tool-spec" data-tool-implementation="unsupported" data-shape={shape} data-state={specState}>
          {HERO_BAND ? null : <h1>{content.h1}</h1>}
          {HERO_BAND ? null : content.heroText ? <p className="lead">{richText(content.heroText)}</p> : null}
              <div className="capability-inputs">
                {specInputs.map((input) => (
                  <label key={input.id} className="capability-field">
                    <span className="capability-label">{localizeChrome(input.label, lang)}</span>
                    {input.kind === "select" ? (
                      <select data-tool-input={input.id} value={values[input.id] ?? ""} onChange={(event) => updateValue(input.id, event.target.value)}>
                        {(input.options ?? []).map((option) => (
                          <option key={option.value} value={option.value}>{localizeChrome(option.label, lang)}</option>
                        ))}
                      </select>
                    ) : input.kind === "file" ? (
                      <input type="file" data-tool-input={input.id} onChange={() => updateValue(input.id, "uploaded")} />
                    ) : input.multiline ? (
                      <textarea data-tool-input={input.id} rows={6} placeholder={input.placeholder} value={values[input.id] ?? ""} onChange={(event) => updateValue(input.id, event.target.value)} />
                    ) : (
                      <input type={input.kind === "number" ? "number" : "text"} data-tool-input={input.id} placeholder={input.placeholder} value={values[input.id] ?? ""} onChange={(event) => updateValue(input.id, event.target.value)} />
                    )}
                    {input.help ? <span className="capability-help">{input.help}</span> : null}
                  </label>
                ))}
              </div>
              <div className="capability-actions">
                <button
                  type="button"
                  className="primary"
                  data-jtbd-action="run"
                  onClick={() => {
                    setSpecState("error");
                  }}
                >{runLabel}</button>
              </div>
              <div className="capability-result" role="alert">{specState === "error" ? unavailable : idleHint}</div>
        </section>
        {toolMedia.length ? (
          <figure className="tool-home-media" data-variant="photos">
            {toolMedia.map((image) => (
              <span key={image.src} className="media"><img src={image.src} alt={image.alt} loading="lazy" decoding="async" /></span>
            ))}
          </figure>
        ) : null}
        </div>
        {lastChecked ? <p className="last-checked last-updated">Last checked <time className="last-checked last-updated" dateTime={lastChecked}>{lastChecked}</time></p> : null}
        <article className="tool-home-article">
        {(content.sections ?? []).map((section, sectionIndex) => (
          <section key={section.id} id={section.id} data-spot={spotted(section) ? "true" : undefined} className="frozen-copy-section" data-rhythm={SECTION_RHYTHM[sectionIndex % SECTION_RHYTHM.length]} data-motion={section.items?.length || section.table ? "scroll-reveal" : undefined}>
            <h2>{section.title}</h2>
            {section.body ? <p>{richText(section.body)}</p> : null}
            {spotted(section) ? <div className="section-spot" aria-hidden="true">{glyphSvg(section.title, "section-spot-glyph")}</div> : null}
            {section.video?.src ? <VideoEmbed src={section.video.src} title={section.video.title} /> : null}
            {section.items?.length ? (
              <ul className={quizShaped ? "editorial-points" : "cards"}>
                {section.items.map((item) => (
                  <li key={item.title}>{listGlyphs(section.items) ? glyphSvg(item.title, "section-glyph") : null}<strong>{item.title}</strong>{item.body ? <p>{richText(item.body)}</p> : null}</li>
                ))}
              </ul>
            ) : null}
            {section.table ? (
              <div className="table-wrap" data-mobile-presentation="scroll">
                {section.table.lastCheckedAt ? <p className="last-checked last-updated">Last checked <time className="last-checked last-updated" dateTime={section.table.lastCheckedAt}>{section.table.lastCheckedAt}</time></p> : null}
                <table className="data-table">
                  {section.table.caption ? <caption>{section.table.caption}</caption> : null}
                  <thead><tr>{section.table.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                  <tbody>
                    {section.table.rows.map((row, rowIndex) => (
                      <tr key={row.recordKey || rowIndex} className={row.status ? "status-" + row.status : undefined}>
                        {row.cells.map((cell, cellIndex) => (
                          <td key={cellIndex} className={row.status ? "status-cell status-" + row.status : undefined} data-label={section.table?.columns[cellIndex] || ""} data-status={row.status || undefined}>{richText(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        ))}
        {content.faq?.length ? (
          <section id="faq" className="frozen-copy-section">
            <h2>{String(config.language ?? "").trim().toLowerCase().startsWith("zh") ? "常见问题" : "FAQ"}</h2>
            <div className="faq-list">
              {content.faq.map((entry) => (
                <details key={entry.question}><summary>{entry.question}</summary><p>{richText(entry.answer)}</p></details>
              ))}
            </div>
          </section>
        ) : null}
        </article>
        {ctas.length ? (
          <div className="ctas">
            {ctas.map((cta) => (
              <a
                key={cta.href + cta.label}
                href={cta.href}
                className={cta.primary ? "primary" : undefined}
                {...(cta.action === "checkout" ? { href: "/api/pay/checkout?plan=pro", "data-shipsite-checkout": "", "data-product": "pro" } as const : {})}
                {...(cta.action === "google_login" ? { "data-shipsite-google-login": "" } as const : {})}
              >{cta.label}</a>
            ))}
          </div>
        ) : null}
      </main>
      <SiteFooter config={config} />
    </div>
  );
}
