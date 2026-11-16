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

export function HeroCopy({ content, kicker }: { content: PageContent; kicker?: string }) {
  return (
    <div className="hero-copy">
      <h1>{content.h1}</h1>
      {kicker ? <p className="kicker">{kicker}</p> : null}
      <p className="lede"><RichText value={content.heroText} /></p>
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
            <button key={cta.label} type="button" className={primary ? "btn solid" : "btn ghost"} onClick={handler}>
              {cta.label}
            </button>
          );
        }
        return (
          <a key={cta.label} href={cta.href} className={primary ? "btn solid" : "btn ghost"}>
            {cta.label}
          </a>
        );
      })}
    </div>
  );
}

export function SectionBlock({ section }: { section: PageSection }) {
  return (
    <section id={section.id} className="band" data-motion="scroll-reveal">
      <header className="band-head">
        <h2>{section.title}</h2>
        {section.body ? <p className="band-lead"><RichText value={section.body} /></p> : null}
      </header>
      {section.steps?.length ? (
        <ol className="steps" data-motion="step-track">
          {section.steps.map((step, index) => (
            <li key={step.title} data-step>
              <span className="step-no" aria-hidden="true" />
              <div>
                <h3>{step.title}</h3>
                <p><RichText value={step.body} /></p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      {section.items?.length ? (
        <ul className="spec-grid" data-motion="stagger-reveal">
          {section.items.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              <p><RichText value={item.body} /></p>
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
        <figure className={`band-figure art-${section.image.src.includes("split") ? "masked" : "framed"}`}>
          <img src={section.image.src} alt={section.image.alt} loading="lazy" />
          {section.image.caption ? <figcaption>{section.image.caption}</figcaption> : null}
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
              {shown ? <p><RichText value={entry.answer} /></p> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
