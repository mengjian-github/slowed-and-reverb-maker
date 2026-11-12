"use client";

import { useEffect, useState } from "react";
import type { Route, SiteConfig } from "@/lib/site-config";
import type { PageContent } from "@/lib/content";

// The floor's own prop types, from the platform data contract — never from
// registry.tsx, which an authoring or repair agent may rewrite with its own
// looser types (AI Video Summary's build check, TS2339 on hero.credit, 2026-10-12).
type NativeRouteProps = { route: Route; content: PageContent; config: SiteConfig };
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
import { VideoEmbed } from "@/components/VideoEmbed";

function formatMmSs(total: number) {
  const sec = Math.max(0, Math.floor(Number(total) || 0));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

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

function toolHomeMedia(content: NativeRouteProps["content"], config: NativeRouteProps["config"], timerShaped: boolean) {
  if (timerShaped) return [] as Array<{ src: string; alt: string }>;
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

function QuizScene({ title }: { title: string }) {
  return (
    <svg className="quiz-scene" viewBox="0 0 640 800" role="img" aria-label={title}>
      <rect width="640" height="800" fill="var(--accent)" />
      <rect width="640" height="300" fill="var(--secondary)" />
      <circle cx="520" cy="90" r="46" fill="color-mix(in srgb, #fff 35%, transparent)" />
      <polygon points="40,800 230,310 410,310 600,800" fill="#14181c" />
      <polygon points="250,310 390,310 430,800 210,800" fill="#1d2329" />
      <rect x="308" y="340" width="24" height="46" fill="#f5e547" />
      <rect x="308" y="410" width="24" height="46" fill="#f5e547" />
      <rect x="308" y="480" width="24" height="46" fill="#f5e547" />
      <rect x="308" y="550" width="24" height="46" fill="#f5e547" />
      <rect x="308" y="620" width="24" height="46" fill="#f5e547" />
      <rect x="308" y="690" width="24" height="46" fill="#f5e547" />
      <rect x="118" y="338" width="10" height="150" fill="#d8dde3" />
      <polygon points="123,210 58,338 188,338" fill="#fff" />
      <polygon points="123,232 78,328 168,328" fill="#e23d28" />
      <rect x="312" y="268" width="12" height="120" fill="#d8dde3" />
      <circle cx="318" cy="196" r="78" fill="#fff" />
      <circle cx="318" cy="196" r="66" fill="#e23d28" />
      <circle cx="318" cy="196" r="52" fill="#fff" />
      <text x="318" y="214" textAnchor="middle" fontSize="48" fontWeight="800" fill="#111">50</text>
      <rect x="478" y="348" width="12" height="140" fill="#d8dde3" />
      <polygon points="484,214 448,238 424,274 424,318 448,354 484,378 520,354 544,318 544,274 520,238" fill="#e23d28" />
      <polygon points="484,226 456,244 438,274 438,318 456,348 484,366 512,348 530,318 530,274 512,244" fill="#fff" />
      <polygon points="484,236 462,250 448,274 448,318 462,342 484,356 506,342 520,318 520,274 506,250" fill="#e23d28" />
      <text x="484" y="310" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff">STOP</text>
      <rect x="430" y="520" width="168" height="220" rx="10" fill="#fff" />
      <rect x="478" y="508" width="72" height="18" rx="4" fill="var(--accent)" />
      <rect x="452" y="556" width="124" height="10" fill="color-mix(in srgb, var(--accent) 35%, #fff)" />
      <rect x="452" y="578" width="96" height="10" fill="color-mix(in srgb, var(--accent) 22%, #fff)" />
      <rect x="452" y="612" width="28" height="28" fill="var(--accent)" />
      <rect x="488" y="618" width="88" height="10" fill="#d8dde3" />
      <rect x="452" y="652" width="28" height="28" fill="#e8e8e8" />
      <rect x="488" y="658" width="88" height="10" fill="#d8dde3" />
      <rect x="452" y="692" width="28" height="28" fill="#e8e8e8" />
      <rect x="488" y="698" width="88" height="10" fill="#d8dde3" />
    </svg>
  );
}

function presetSeconds(preset: string) {
  const key = String(preset || "").trim().toLowerCase();
  if (key === "shortbreak" || key === "break" || key === "5") return 300;
  if (key === "longbreak" || key === "15") return 900;
  const asNum = Number(preset);
  if (Number.isFinite(asNum) && asNum > 0) return asNum > 180 ? asNum : Math.round(asNum * 60);
  return 1500;
}

const SECTION_RHYTHM: number[] = [1,2,1,0,0,0];
const HERO_BAND = true;
const TICKER = true;

export default function NativeToolHome(props: any) {
  const { route, content, config } = props as NativeRouteProps;
  const spec = (config.toolSpecs ?? [])[0] ?? null;
  const req = config.runtimeRequirements;
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
  const spotted = (section: { title?: string; items?: unknown[]; table?: unknown; video?: unknown }) =>
    !section.items?.length && !section.table && !section.video && Boolean(glyphOf(section.title));
  const listGlyphs = (items: { title?: string }[] | undefined) => Boolean(items?.length) && (items ?? []).every((item) => Boolean(glyphOf(item.title)));
  const timerShaped = /timer|pomodoro|countdown|计时|倒计时/i.test([spec?.id, spec?.title, spec?.jtbd, content.h1].join(" ")) && specInputs.every((input) => /^(preset|duration|minutes|seconds)$/i.test(String(input.id)));
  const quizShaped = /quiz|topic|exam|question|patente|driving.?theor/i.test([spec?.id, spec?.title, spec?.jtbd, ...specInputs.map((input) => input.id + " " + input.label)].join(" "));
  const shape = timerShaped ? "timer" : quizShaped ? "quiz" : "form";
  const lang = visitorChromeLang(config, content);
  const runLabel = quizShaped
    ? (lang.startsWith("zh") ? "开始测验" : lang.startsWith("it") ? "Inizia il quiz" : "Start quiz")
    : (spec?.output?.label && !/^score$/i.test(spec.output.label) && spec.output.label.trim().split(/\s+/).length <= 3 && !/machine|json|summary/i.test(spec.output.label) ? spec.output.label
      : /generat|生成/i.test([spec?.id, spec?.title].join(" ")) ? (lang.startsWith("zh") ? "生成" : lang.startsWith("it") ? "Genera" : "Generate")
      : lang.startsWith("zh") ? "运行" : lang.startsWith("it") ? "Avvia" : "Run");
  const idleHint = quizShaped
    ? (lang.startsWith("zh") ? "选择类型和主题后开始。" : lang.startsWith("it") ? "Scegli tipo e argomento, poi inizia." : "Pick a type and topic, then start.")
    : (lang.startsWith("zh") ? "填写后运行。" : lang.startsWith("it") ? "Compila i campi, poi avvia." : "Fill the fields, then run.");
  const [preset, setPreset] = useState("focus");
  const [remaining, setRemaining] = useState(1500);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
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
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);
  const state = running ? "working" : remaining === 0 && started ? "success" : "idle";
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
  const toolMedia = toolHomeMedia(content, config, timerShaped);
  const hasPricing = (config.routes ?? []).some((entry) => /\/(?:pricing|plans)\/?$/i.test(String(entry.path ?? "")));
  const ctas = (content.ctas ?? []).filter((cta) => cta.action !== "google_login" && (cta.action !== "checkout" || (hasPricing && config.publicSalesAllowed !== false)));
  if (config.publicSalesAllowed !== false && hasPricing && req?.requiresBilling && !ctas.some((cta) => cta.action === "checkout")) {
    ctas.push({ href: "/pricing/", label: "Start Pro", primary: true, action: "checkout" });
  }
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
        <section className="capability" data-capability={capId} data-operation="tool-spec" data-tool-implementation={timerShaped ? "timer" : "unsupported"} data-shape={shape} data-state={timerShaped ? state : specState}>
          {HERO_BAND ? null : <h1>{content.h1}</h1>}
          {HERO_BAND ? null : content.heroText ? <p className="lead">{richText(content.heroText)}</p> : null}
          {timerShaped ? (
            <>
          <output className="capability-output" data-jtbd-output data-tool-output>{formatMmSs(remaining)}</output>
          <div className="capability-actions">
            <button
              type="button"
              className="primary"
              data-jtbd-action="start"
              onClick={() => {
                setStarted(true);
                if (remaining <= 0) setRemaining(presetSeconds(preset));
                setRunning(true);
              }}
            >Start</button>
            <button type="button" onClick={() => setRunning(false)}>Pause</button>
            <button type="button" onClick={() => { setRunning(false); setStarted(false); setRemaining(presetSeconds(preset)); }}>Reset</button>
          </div>
          <div className="capability-controls">
            <label className="capability-field">
              <span className="capability-label">Preset</span>
              <select
                data-tool-input="preset"
                value={preset}
                onChange={(event) => {
                  const next = event.target.value;
                  setPreset(next);
                  if (!running) setRemaining(presetSeconds(next));
                }}
              >
                <option value="focus">Focus 25 min</option>
                <option value="shortBreak">Short break 5 min</option>
                <option value="longBreak">Long break 15 min</option>
              </select>
            </label>
            <label className="capability-field">
              <span className="capability-label">Duration (seconds)</span>
              <input
                type="number"
                data-tool-input="duration"
                value={remaining}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (Number.isFinite(next) && next >= 0) setRemaining(next);
                }}
              />
            </label>
          </div>
            </>
          ) : (
            <>
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
            </>
          )}
          {timerShaped && lastChecked ? <p className="last-checked last-updated">Last checked <time className="last-checked last-updated" dateTime={lastChecked}>{lastChecked}</time></p> : null}
        </section>
        {(toolMedia.length || quizShaped) ? (
          <figure className="tool-home-media" data-variant={toolMedia.length ? "photos" : "scene"}>
            {toolMedia.length ? toolMedia.map((image) => (
              <span key={image.src} className="media"><img src={image.src} alt={image.alt} loading="lazy" decoding="async" /></span>
            )) : <QuizScene title={String(content.h1 ?? "")} />}
          </figure>
        ) : null}
        </div>
        {!timerShaped && lastChecked ? <p className="last-checked last-updated">Last checked <time className="last-checked last-updated" dateTime={lastChecked}>{lastChecked}</time></p> : null}
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
