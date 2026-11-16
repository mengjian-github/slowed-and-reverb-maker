"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { PageContent, PageSection } from "@/lib/content";
import type { SiteConfig } from "@/lib/site-config";
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
import { RichText } from "@/components/ui/rich-text";

export function PageShell({ config, children }: { config: SiteConfig; children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#content">Skip to content</a>
      <div className="scroll-progress" aria-hidden="true" />
      <SiteHeader config={config} />
      <main id="content">{children}</main>
      <SiteFooter config={config} />
    </>
  );
}

/** Approved copy separates paragraphs with a blank line. RichText renders one
 *  inline run, so a body with three paragraphs printed as a single 1,200-char
 *  wall (the guide's short answer, 2026-11-16). Split on blank lines and give
 *  each its own <p>; a one-paragraph body is unchanged. */
export function ProseBlock({ value, className }: { value?: string | null; className?: string }) {
  const parts = (value ?? "")
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return null;
  return (
    <div className={className}>
      {parts.map((part, index) => (
        <p key={index}><RichText value={part} /></p>
      ))}
    </div>
  );
}

export function HeroCopy({ content, kicker }: { content: PageContent; kicker?: string }) {
  return (
    <div className="hero-copy">
      {kicker ? <p className="eyebrow"><span className="dot" aria-hidden="true" />{kicker}</p> : null}
      <h1>{content.h1}</h1>
      <ProseBlock className="lede" value={content.heroText} />
    </div>
  );
}

export function CtaRow({ content, onPrimary, onSecondary }: {
  content: PageContent;
  onPrimary?: () => void;
  onSecondary?: () => void;
}) {
  const ctas = content.ctas ?? [];
  return (
    <div className="cta-row">
      {ctas.map((cta, index) => {
        const primary = Boolean(cta.primary);
        const handler = primary ? onPrimary : onSecondary;
        if (handler) {
          return (
            <button key={cta.label} type="button" className={primary ? "btn" : "btn link"} onClick={handler}>
              {cta.label}
            </button>
          );
        }
        return (
          <a key={cta.label} href={cta.href} className={primary ? "btn" : "btn link"}>
            {cta.label}
          </a>
        );
      })}
    </div>
  );
}

export function SectionBlock({ section }: { section: PageSection }) {
  return (
    <section id={section.id} className="band">
      <header className="band-head">
        <h2>{section.title}</h2>
        {section.body ? <ProseBlock className="band-lead" value={section.body} /> : null}
      </header>
      {section.steps?.length ? (
        <ol className="steps">
          {section.steps.map((step, index) => (
            <li key={step.title} data-step>
              <span className="step-no" aria-hidden="true" />
              <div>
                <h3>{step.title}</h3>
                <ProseBlock value={step.body} />
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      {section.items?.length ? (
        <ul className="spec-grid">
          {section.items.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              <ProseBlock value={item.body} />
            </li>
          ))}
        </ul>
      ) : null}
      {section.table ? (
        <div className="table-wrap">
          <table>
            <caption>{section.table.caption}</caption>
            <thead>
              <tr>{section.table.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr>
            </thead>
            <tbody>
              {section.table.rows.map((row) => (
                <tr key={row.cells.join("|")}>
                  {row.cells.map((cell, index) => index === 0
                    ? <th key={cell} scope="row">{cell}</th>
                    : <td key={cell}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {section.table.lastCheckedAt ? (
            <p className="checked">Checked <time dateTime={section.table.lastCheckedAt}>{section.table.lastCheckedAt}</time></p>
          ) : null}
        </div>
      ) : null}
      {section.image ? (
        <figure className="band-figure">
          <img src={section.image.src} alt={section.image.alt} decoding="async" />
          {section.image.caption ? <figcaption>{section.image.caption}</figcaption> : null}
          {section.image.credit ? (
            <p className="figure-credit">
              {section.image.sourceUrl
                ? <a href={section.image.sourceUrl} rel="nofollow noopener" target="_blank">{section.image.credit}</a>
                : section.image.credit}
            </p>
          ) : null}
        </figure>
      ) : null}
    </section>
  );
}

export function Sections({ content, skip }: { content: PageContent; skip?: string[] }) {
  const skipped = new Set(skip ?? []);
  return (
    <>
      {(content.sections ?? []).filter((section) => !skipped.has(section.id)).map((section) => (
        <SectionBlock key={section.id} section={section} />
      ))}
    </>
  );
}

export function FaqList({ content }: { content: PageContent }) {
  const [open, setOpen] = useState(0);
  if (!content.faq?.length) return null;
  return (
    <section className="band faq-band" id="faq">
      <h2>Questions</h2>
      <div className="faq-list">
        {content.faq.map((entry, index) => {
          const shown = open === index;
          return (
            <div key={entry.question} className={shown ? "faq open" : "faq"}>
              <h3>
                <button type="button" aria-expanded={shown} onClick={() => setOpen(shown ? -1 : index)}>
                  {entry.question}
                  <span aria-hidden="true">{shown ? "–" : "+"}</span>
                </button>
              </h3>
              {shown ? <ProseBlock value={entry.answer} /> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
