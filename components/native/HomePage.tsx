"use client";

import { useRef } from "react";
import type { Route, SiteConfig } from "@/lib/site-config";
import type { PageContent } from "@/lib/content";
import { RichText } from "@/components/ui/rich-text";
import { Studio } from "./Studio";
import { CtaRow, FaqList, PageShell, Sections } from "./PageShell";
import { WaveStrip } from "./WaveStrip";

type NativeRouteProps = { route: Route; content: PageContent; config: SiteConfig };

const FACTS = [
  "Nothing is uploaded: the audio decodes and plays inside this tab.",
  "WAV for editors, MP3 for sharing; both match the preview.",
  "No account, no watermark, no export limit.",
];

export function HomePage({ content, config }: NativeRouteProps) {
  const studio = useRef<HTMLDivElement>(null);

  function openFile() {
    studio.current?.querySelector<HTMLInputElement>('input[type="file"]')?.click();
    studio.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function playSample() {
    studio.current?.querySelector<HTMLButtonElement>(".drop-actions .ghost, .drop-actions .btn:not(.solid)")?.click();
  }

  return (
    <PageShell config={config}>
      <section className="hero-band">
        <p className="eyebrow"><span className="dot" aria-hidden="true" />In the browser, nothing uploaded</p>
        <h1>{content.h1}</h1>
        <p className="lede"><RichText value={content.heroText} /></p>
        <CtaRow content={content} onPrimary={openFile} onSecondary={playSample} />
        <WaveStrip note="The shape you are making, in one line:" />
      </section>

      <div className="hero-grid">
        <div ref={studio} className="stage-tool" id="console">
          <Studio idPrefix="home" />
        </div>
        <aside className="rail">
          <figure className="stage-still">
            <img src="/images/slots/home-tool.png" alt={content.hero?.alt ?? "A producer working late at night in a dim bedroom studio, reaching toward a glowing laptop"} />
            <figcaption>
              <span className="still-chip">0.80× · reverb 55% · +4 dB</span>
              {content.hero?.caption ?? "Late-night sessions are where most slowed edits are born."}
            </figcaption>
          </figure>
          <dl className="stage-metrics">
            <div><dt>Speed</dt><dd>0.5–1.5×</dd></div>
            <div><dt>Pitch</dt><dd>±12 st</dd></div>
            <div><dt>Export</dt><dd>WAV · MP3</dd></div>
          </dl>
          <ul className="rail-facts">
            {FACTS.map((fact) => (
              <li key={fact}>
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <Sections content={content} skip={["faq"]} />
      <FaqList content={content} />
    </PageShell>
  );
}
