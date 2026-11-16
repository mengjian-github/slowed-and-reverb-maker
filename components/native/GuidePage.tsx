"use client";

import type { Route, SiteConfig } from "@/lib/site-config";
import type { PageContent } from "@/lib/content";
import { PRESETS } from "@/lib/audio-engine";
import { CtaRow, FaqList, HeroCopy, PageShell, Sections } from "./PageShell";

type NativeRouteProps = { route: Route; content: PageContent; config: SiteConfig };

const CLASSIC = PRESETS.classic;

/** The four numbers of the classic recipe, drawn as a scale so the guide opens
 *  on the actual preset the tool applies rather than another paragraph. */
const RECIPE = [
  { label: "Speed", value: `${CLASSIC.speed.toFixed(2)}×`, ratio: (CLASSIC.speed - 0.5) / 1, note: "half to one and a half" },
  { label: "Pitch", value: `−${Math.abs(CLASSIC.pitch)} st`, ratio: (CLASSIC.pitch + 12) / 24, note: "twelve down to twelve up" },
  { label: "Reverb", value: `${CLASSIC.reverbPct}%`, ratio: CLASSIC.reverbPct / 100, note: "dry to soaked" },
  { label: "Bass", value: `+${CLASSIC.bassDb} dB`, ratio: CLASSIC.bassDb / 12, note: "none to heavy" },
];

export function GuidePage({ content, config }: NativeRouteProps) {
  return (
    <PageShell config={config}>
      <section className="hero-band hero-band-guide">
        <HeroCopy content={content} kicker="The guide" />
        <CtaRow content={content} />
      </section>

      <section className="recipe-band" aria-label="The classic slowed and reverb recipe">
        <h2 className="band-label">The classic preset, as numbers</h2>
        <dl className="recipe-strip">
          {RECIPE.map((item) => (
            <div key={item.label} className="recipe-item">
              <dt>{item.label}</dt>
              <dd>
                <span className="recipe-value">{item.value}</span>
                <span className="recipe-scale" aria-hidden="true">
                  <span style={{ width: `${Math.round(Math.min(1, Math.max(0, item.ratio)) * 100)}%` }} />
                </span>
                <span className="recipe-note">{item.note}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <Sections content={content} />
      <FaqList content={content} />
    </PageShell>
  );
}
