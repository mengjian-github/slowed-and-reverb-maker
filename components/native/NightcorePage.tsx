"use client";

import { useRef } from "react";
import type { Route, SiteConfig } from "@/lib/site-config";
import type { PageContent } from "@/lib/content";
import { Studio } from "./Studio";
import { CtaRow, FaqList, HeroCopy, PageShell, Sections } from "./PageShell";

type NativeRouteProps = { route: Route; content: PageContent; config: SiteConfig };

export function NightcorePage({ content, config }: NativeRouteProps) {
  const studio = useRef<HTMLDivElement>(null);
  function openFile() {
    studio.current?.querySelector<HTMLInputElement>('input[type="file"]')?.click();
  }
  function playSample() {
    studio.current?.querySelector<HTMLButtonElement>(".drop-actions .ghost")?.click();
  }
  return (
    <PageShell config={config}>
      <div className="stage stage-night">
        <div className="stage-copy">
          <HeroCopy content={content} kicker="1.25×, pitch up, brighter" />
          <CtaRow content={content} onPrimary={openFile} onSecondary={playSample} />
        </div>
        <div ref={studio} className="stage-tool">
          <Studio idPrefix="night" defaultPreset="nightcore" />
        </div>
        <div className="tempo-card" aria-hidden="true">
          <svg viewBox="0 0 240 120">
            <path d="M16 96 C 60 96 70 40 120 40 C 170 40 180 96 224 96" fill="none" stroke="currentColor" strokeWidth="3" />
            <circle cx="168" cy="62" r="7" fill="currentColor" />
            <text x="16" y="24" fontSize="16">Nightcore</text>
            <text x="16" y="112" fontSize="14">1.25× speed, +4 semitones</text>
          </svg>
        </div>
        <dl className="stage-metrics">
          <div><dt>Preset</dt><dd>Nightcore</dd></div>
          <div><dt>Speed</dt><dd>1.25×</dd></div>
          <div><dt>Pitch</dt><dd>+4 st</dd></div>
        </dl>
      </div>
      <Sections content={content} skip={["faq"]} />
      <FaqList content={content} />
    </PageShell>
  );
}
