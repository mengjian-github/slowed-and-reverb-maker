"use client";

import type { Route, SiteConfig } from "@/lib/site-config";
import type { PageContent } from "@/lib/content";
import { PRESETS } from "@/lib/audio-engine";
import { CtaRow, FaqList, HeroCopy, PageShell, Sections } from "./PageShell";

type NativeRouteProps = { route: Route; content: PageContent; config: SiteConfig };

const SLOWED = PRESETS.classic;
const NIGHTCORE = PRESETS.nightcore;

const ROWS = [
  { label: "Speed", slowed: `${SLOWED.speed.toFixed(2)}×`, nightcore: `${NIGHTCORE.speed.toFixed(2)}×`, slowedRatio: SLOWED.speed / 1.5, nightcoreRatio: NIGHTCORE.speed / 1.5 },
  { label: "Pitch", slowed: `−${Math.abs(SLOWED.pitch)} st`, nightcore: `+${NIGHTCORE.pitch} st`, slowedRatio: (SLOWED.pitch + 12) / 24, nightcoreRatio: (NIGHTCORE.pitch + 12) / 24 },
  { label: "Reverb", slowed: `${SLOWED.reverbPct}%`, nightcore: `${NIGHTCORE.reverbPct}%`, slowedRatio: SLOWED.reverbPct / 100, nightcoreRatio: NIGHTCORE.reverbPct / 100 },
  { label: "Bass boost", slowed: `+${SLOWED.bassDb} dB`, nightcore: `${NIGHTCORE.bassDb} dB`, slowedRatio: SLOWED.bassDb / 12, nightcoreRatio: NIGHTCORE.bassDb / 12 },
];

export function ComparePage({ content, config }: NativeRouteProps) {
  return (
    <PageShell config={config}>
      <section className="hero-band">
        <HeroCopy content={content} kicker="Two directions, one engine" />
        <CtaRow content={content} />
      </section>

      <section className="split-band" aria-label="The two presets compared">
        <div className="split-panel split-slow">
          <header>
            <span className="split-tag">Down</span>
            <h2>Slowed + reverb</h2>
          </header>
          <ul className="split-list">
            {ROWS.map((row) => (
              <li key={row.label}>
                <span className="split-label">{row.label}</span>
                <span className="split-value">{row.slowed}</span>
                <span className="split-track" aria-hidden="true"><span style={{ width: `${Math.round(Math.min(1, Math.max(0, row.slowedRatio)) * 100)}%` }} /></span>
              </li>
            ))}
          </ul>
          <a className="btn" href="/">Open the slowed maker</a>
        </div>
        <div className="split-divider" aria-hidden="true" />
        <div className="split-panel split-fast">
          <header>
            <span className="split-tag">Up</span>
            <h2>Nightcore</h2>
          </header>
          <ul className="split-list">
            {ROWS.map((row) => (
              <li key={row.label}>
                <span className="split-label">{row.label}</span>
                <span className="split-value">{row.nightcore}</span>
                <span className="split-track" aria-hidden="true"><span style={{ width: `${Math.round(Math.min(1, Math.max(0, row.nightcoreRatio)) * 100)}%` }} /></span>
              </li>
            ))}
          </ul>
          <a className="btn" href="/nightcore-maker/">Open the nightcore maker</a>
        </div>
      </section>

      <Sections content={content} />
      <FaqList content={content} />
    </PageShell>
  );
}
