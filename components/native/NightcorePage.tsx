"use client";

import { useRef } from "react";
import type { Route, SiteConfig } from "@/lib/site-config";
import type { PageContent } from "@/lib/content";
import { RichText } from "@/components/ui/rich-text";
import { Studio } from "./Studio";
import { CtaRow, FaqList, PageShell, Sections } from "./PageShell";

type NativeRouteProps = { route: Route; content: PageContent; config: SiteConfig };

/** The nightcore page keeps its own first screen: copy left, console right,
 *  and a speed-lines card that shows where the two styles sit. */
export function NightcorePage({ content, config }: NativeRouteProps) {
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
      <div className="stage stage-night">
        <div className="stage-copy">
          <h1>{content.h1}</h1>
          <p className="lede"><RichText value={content.heroText} /></p>
          <CtaRow content={content} onPrimary={openFile} onSecondary={playSample} />
          <div className="speed-card" aria-hidden="true">
            <svg viewBox="0 0 320 96">
              <line x1="16" y1="58" x2="304" y2="58" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
              {[0, 1, 2, 3].map((tick) => (
                <line key={tick} x1={16 + tick * 96} y1="50" x2={16 + tick * 96} y2="66" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
              ))}
              <text x="16" y="86" fontSize="12">0.5×</text>
              <text x="160" y="86" fontSize="12" textAnchor="middle">1.0×</text>
              <text x="304" y="86" fontSize="12" textAnchor="end">1.5×</text>
              <rect x="16" y="44" width="64" height="8" rx="1" fill="currentColor" opacity="0.5" />
              <rect x="120" y="34" width="12" height="28" rx="1" fill="currentColor" />
              <text x="126" y="26" fontSize="12" textAnchor="middle" fontWeight="700">1.25×</text>
              <text x="48" y="26" fontSize="12" textAnchor="middle">0.8×</text>
            </svg>
            <p>Nightcore sits right of the middle: speed and pitch lift together.</p>
          </div>
          <dl className="stage-metrics">
            <div><dt>Preset</dt><dd>Nightcore</dd></div>
            <div><dt>Speed</dt><dd>1.25×</dd></div>
            <div><dt>Pitch</dt><dd>+4 st</dd></div>
          </dl>
          <ul className="rail-facts night-facts">
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              <span>The Nightcore preset is already applied on this page: 1.25× speed, +4 semitones, a light 12% reverb.</span>
            </li>
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              <span>Move speed and pitch apart for a plain sped-up version that keeps the original vocal depth.</span>
            </li>
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              <span>Rendering happens offline in the tab, so the export is the version you just heard.</span>
            </li>
          </ul>
        </div>
        <div ref={studio} className="stage-tool" id="console">
          <Studio idPrefix="night" defaultPreset="nightcore" />
        </div>
      </div>
      <Sections content={content} skip={["faq"]} />
      <FaqList content={content} />
    </PageShell>
  );
}
