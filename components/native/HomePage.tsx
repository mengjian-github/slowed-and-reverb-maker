"use client";

import { useRef } from "react";
import type { Route, SiteConfig } from "@/lib/site-config";
import type { PageContent } from "@/lib/content";
import { Studio } from "./Studio";
import { CtaRow, FaqList, HeroCopy, PageShell, Sections } from "./PageShell";

type NativeRouteProps = { route: Route; content: PageContent; config: SiteConfig };

export function HomePage({ content, config }: NativeRouteProps) {
  const studio = useRef<HTMLDivElement>(null);

  function openFile() {
    studio.current?.querySelector<HTMLInputElement>('input[type="file"]')?.click();
    studio.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function playSample() {
    studio.current?.querySelector<HTMLButtonElement>(".drop-actions .ghost")?.click();
  }

  return (
    <PageShell config={config}>
      <div className="stage">
        <div className="stage-copy">
          <HeroCopy content={content} kicker="In the browser, nothing uploaded" />
          <CtaRow content={content} onPrimary={openFile} onSecondary={playSample} />
        </div>
        <div ref={studio} className="stage-tool">
          <Studio idPrefix="home" />
        </div>
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
      </div>
      <Sections content={content} skip={["faq"]} />
      <FaqList content={content} />
    </PageShell>
  );
}
