"use client";

import type { Route, SiteConfig } from "@/lib/site-config";
import type { PageContent } from "@/lib/content";
import { PRESETS } from "@/lib/audio-engine";
import { CtaRow, FaqList, HeroCopy, PageShell, Sections } from "./PageShell";

type NativeRouteProps = { route: Route; content: PageContent; config: SiteConfig };

const CLASSIC = PRESETS.classic;

/** Beat grid: a fixed 3.6 s window at 120 BPM, then the same beats at each
 *  preset's speed. Ticks are positioned from the preset's own number, so the
 *  drawing proves the tempo claim instead of illustrating it. */
const WINDOW_MS = 3600;
const SOURCE_BPM = 120;
const BEAT_ROWS = [
  { name: "Original", speed: 1 },
  { name: "Classic Slowed + Reverb", speed: PRESETS.classic.speed },
  { name: "Nightcore", speed: PRESETS.nightcore.speed },
];

function beatTicks(speed: number) {
  const spacing = 60000 / SOURCE_BPM / speed; // ms per beat at this speed
  const ticks: number[] = [];
  for (let i = 0; i * spacing <= WINDOW_MS; i += 1) ticks.push(i * spacing);
  return ticks;
}

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
        <HeroCopy content={content} />
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

      <figure className="beat-figure">
        <figcaption>
          <span className="beat-caption">Same beat, three speeds</span>
          <span className="beat-legend">A 3.6-second window at 120 BPM. Each tick is a beat; the preset&apos;s speed moves them apart or crowds them together.</span>
        </figcaption>
        <div className="beat-rows">
          {BEAT_ROWS.map((row) => {
            const spacing = 60000 / SOURCE_BPM / row.speed;
            return (
              <div key={row.name} className="beat-row">
                <span className="beat-label">
                  <b>{row.name}</b>
                  <span>{row.speed.toFixed(2)}× · {Math.round(SOURCE_BPM * row.speed)} BPM · {Math.round(spacing)} ms per beat</span>
                </span>
                <span className="beat-track" aria-hidden="true">
                  {beatTicks(row.speed).map((tick, index) => (
                    <span
                      key={index}
                      className={index % 4 === 0 ? "beat-tick strong" : "beat-tick"}
                      style={{ left: `${(tick / WINDOW_MS) * 100}%` }}
                    />
                  ))}
                </span>
              </div>
            );
          })}
        </div>
      </figure>

      <Sections content={content} />
      <FaqList content={content} />
    </PageShell>
  );
}
