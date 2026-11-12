"use client";

// /nightcore-maker/ — the same engine tuned for the sped-up style: console
// beside the step rail and style explanation, styles table, then FAQ.

import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

import type { NativeRouteProps } from "./registry";
import AudioStudio from "./AudioStudio";
import { FaqSection, Hero, ItemsGrid, SchemaScript, StepsColumn, StudioShell } from "./studio-parts";

export default function NightcoreMakerPage({ content, config }: NativeRouteProps) {
  const byId = new Map(content.sections.map((s) => [s.id, s]));
  const tool = byId.get("tool");
  const how = byId.get("how-it-works");
  const styles = byId.get("styles");
  const faqSec = byId.get("faq");

  const rest = content.sections
    .filter((s) => !["tool", "how-it-works", "styles", "faq"].includes(s.id))
    .map((section) => <ItemsGrid key={section.id} section={section} />);

  return (
    <>
      <SiteHeader config={config} currentPath="/nightcore-maker/" />
      <StudioShell>
        <Hero
          content={content}
          blockWord="Maker"
          voice="Faster, higher, brighter."
          voiceSub="Load a song, apply the Nightcore preset or set speed and pitch yourself, hear it change live, and export MP3 or WAV — free, no signup."
          consoleSlot={<AudioStudio defaultPreset="nightcore" exportTag="nightcore" accentNote="no upload" />}
          figure={
            <figure className="hero-figure rise" aria-label="The two numbers behind every style">
              <svg viewBox="0 0 260 136" role="img" className="style-ladder">
                <line x1="40" y1="90" x2="220" y2="30" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="5 5" />
                {[
                  { x: 40, y: 90, label: "0.8×", tag: "Slowed", up: false },
                  { x: 130, y: 60, label: "1.0×", tag: "Original", up: false },
                  { x: 220, y: 30, label: "1.25×", tag: "Nightcore", up: true },
                ].map((p) => (
                  <g key={p.tag}>
                    <circle cx={p.x} cy={p.y} r="10" fill={p.up ? "var(--accent)" : "transparent"} stroke="var(--accent)" strokeWidth="2" />
                    <text x={p.x} y={p.y - 20} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--text)">{p.label}</text>
                    <text x={p.x} y={p.y + 26} textAnchor="middle" fontSize="10" fill="var(--text-muted)" letterSpacing="1">{p.tag.toUpperCase()}</text>
                  </g>
                ))}
                <text x="150" y="130" textAnchor="middle" fontSize="9" fill="var(--accent)" letterSpacing="1">SPEED AND PITCH RIDE TOGETHER</text>
              </svg>
              <figcaption>
                <svg viewBox="0 0 26 10" width="22" height="9" aria-hidden="true">
                  <path d="M1 9 C 8 2 18 1 25 4" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                One dial up for nightcore, one down for slowed — same engine
              </figcaption>
            </figure>
          }
        />

        {tool ? <ItemsGrid section={tool} /> : null}

        <div className="split-row">
          <div className="split-main">{how ? <StepsColumn section={how} /> : null}</div>
          <div className="split-side">{styles ? <ItemsGrid section={styles} /> : null}</div>
        </div>

        {rest}

        {content.faq ? <FaqSection faq={content.faq} title={faqSec?.title ?? "Nightcore FAQ"} body={faqSec?.body} /> : null}
      </StudioShell>
      <SiteFooter config={config} currentPath="/nightcore-maker/" />
      <SchemaScript schema={content.schema} />
    </>
  );
}
