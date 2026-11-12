"use client";

// Shared parts of the two studio pages: the oversized-type hero with its
// pulsing bar band, section renderers in content order, the formats/style
// table and the FAQ accordion. Both pages compose from these.

import { useEffect, useRef } from "react";

import type { PageContent, PageSection } from "@/lib/content";

import { chivo } from "./fonts";

/** Decaying-bars band under the headline: the brand mark, blown up. */
export function BarBand() {
  const bars = [80, 70, 60, 50, 42, 34, 27, 20];
  const xs = [8, 54, 96, 135, 171, 203, 232, 258];
  const widths = [38, 34, 31, 28, 24, 21, 18, 15];
  return (
    <div className="band-wrap" aria-hidden="true">
      <svg className="band" viewBox="0 0 1200 90" preserveAspectRatio="none">
        <path className="arc" d="M286 66 C 560 26 920 18 1198 40" fill="none" strokeWidth="2" />
        {bars.map((h, i) => (
          <rect key={i} className="bar" x={xs[i]} y={90 - h - 0.5} width={widths[i]} height={h} rx="4" opacity={0.95 - i * 0.08} style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
        <line className="base" x1="0" y1="89.5" x2="1200" y2="89.5" strokeWidth="1" />
      </svg>
    </div>
  );
}

export function Hero({
  content,
  blockWord,
  voice,
  voiceSub,
  consoleSlot,
  figure,
}: {
  content: PageContent;
  blockWord: string;
  voice: string;
  voiceSub: string;
  consoleSlot?: React.ReactNode;
  figure?: React.ReactNode;
}) {
  const words = content.h1.split(" ");
  const pick = words.findIndex((w) => w.replace(/[^A-Za-z]/g, "").toLowerCase() === blockWord.toLowerCase());
  const onCta = (label: string) => {
    if (/sample/i.test(label)) window.dispatchEvent(new CustomEvent("srstudio:sample"));
    else window.dispatchEvent(new CustomEvent("srstudio:pick"));
  };
  return (
    <>
      <div className="hero-type rise">
        <h1>
          {words.map((w, i) => (
            <span key={i}>
              {i === pick ? <span className="h-block">{w}</span> : w}
              {i < words.length - 1 ? " " : ""}
              {i === 0 && words.length > 2 ? <br /> : null}
            </span>
          ))}
        </h1>
      </div>
      <BarBand />
      <div className="hero-grid">
        <div className="hero-copy rise">
          <p className="voice">{voice}</p>
          <p className="voice-sub">{voiceSub}</p>
          <p className="lede">{content.heroText}</p>
          <div className="ctas">
            {content.ctas.map((cta) => (
              <button key={cta.label} type="button" className={cta.primary ? "btn-primary" : "btn-ghost"} onClick={() => onCta(cta.label)}>
                {cta.label}
              </button>
            ))}
          </div>
          {figure}
        </div>
        {consoleSlot ? (
          <div className="console-wrap rise" id="console">
            {consoleSlot}
          </div>
        ) : null}
      </div>
    </>
  );
}

/** The page's own shell: font class + studio frame. */
export function StudioShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${chivo.className} studio-page`}>
      <main className="shell">{children}</main>
    </div>
  );
}

/** Answers carry the same single [label](href) link as bodies. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        return m ? <a key={i} href={m[2]}>{m[1]}</a> : part;
      })}
    </>
  );
}

/** Inline markdown link support for item/step bodies rendered inside <p>. */
function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        return m ? <a key={i} href={m[2]}>{m[1]}</a> : <span key={i}>{part}</span>;
      })}
    </>
  );
}

function Body({ text }: { text: string }) {
  // Approved bodies carry one markdown-style link at most; keep the copy
  // verbatim and turn [label](href) into a real anchor.
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <p className="sec-body">
      {parts.map((part, i) => {
        const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        return m ? (
          <a key={i} href={m[2]}>
            {m[1]}
          </a>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </p>
  );
}

export function ItemsGrid({ section }: { section: PageSection }) {
  return (
    <section className="sec" id={section.id}>
      <h2>{section.title}</h2>
      <Body text={section.body} />
      {section.items?.length ? (
        <div className="cards" data-motion="stagger-reveal">
          {section.items.map((item) => (
            <article key={item.title} className="card">
              <h3>{item.title}</h3>
              <p><InlineText text={item.body} /></p>
            </article>
          ))}
        </div>
      ) : null}
      {section.table ? <SpecTable table={section.table} /> : null}
      {section.image ? <EditorialFigure image={section.image} /> : null}
    </section>
  );
}

export function StepsColumn({ section, figure }: { section: PageSection; figure?: React.ReactNode }) {
  return (
    <div className="side-rail">
      <section className="sec rail-sec" id={section.id}>
        <h2>{section.title}</h2>
        <Body text={section.body} />
        <ol className="steps">
          {section.steps?.map((step, i) => (
            <li key={step.title} className="step">
              <span className="step-num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p><InlineText text={step.body} /></p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      {figure}
    </div>
  );
}

type TableShape = NonNullable<PageSection["table"]>;

export function SpecTable({ table }: { table: TableShape }) {
  return (
    <figure className="spec-table-wrap">
      <table className="spec-table">
        {table.caption ? <caption>{table.caption}</caption> : null}
        <thead>
          <tr>
            {table.columns.map((col) => (
              <th key={col} scope="col">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i}>
              {row.cells.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.lastCheckedAt ? <figcaption className="table-note">Checked {table.lastCheckedAt}.</figcaption> : null}
    </figure>
  );
}

type ImageShape = NonNullable<PageSection["image"]>;

export function EditorialFigure({ image, className }: { image: ImageShape; className?: string }) {
  return (
    <figure className={`editorial-figure${className ? ` ${className}` : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.src} alt={image.alt} loading="lazy" />
      {image.caption ? <figcaption>{image.caption}</figcaption> : null}
    </figure>
  );
}

export function FaqSection({ faq, title, body }: { faq: NonNullable<PageContent["faq"]>; title: string; body?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    // deep-linking to a question opens its panel
    const openFromHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      const node = ref.current?.querySelector(`#${CSS.escape(hash)}`) as HTMLDetailsElement | null;
      if (node?.tagName === "DETAILS") node.open = true;
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);
  return (
    <section className="sec faq-sec" id="faq" ref={ref}>
      <h2>{title}</h2>
      {body ? <Body text={body} /> : null}
      <div className="faq">
        {faq.map((item, i) => (
          <details key={item.question} className="faq-item" id={`faq-${i + 1}`}>
            <summary>
              {item.question}
              <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </summary>
            <RichText text={item.answer} />
          </details>
        ))}
      </div>
    </section>
  );
}

export function SchemaScript({ schema }: { schema?: Record<string, unknown> }) {
  if (!schema) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
