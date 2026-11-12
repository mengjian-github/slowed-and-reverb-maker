"use client";

// / — Slowed and Reverb Maker: hero with the console on the first screen,
// then sections in approved order (tool → how-it-works + formats → faq).

import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

import type { NativeRouteProps } from "./registry";
import type { PageSection } from "@/lib/content";
import AudioStudio from "./AudioStudio";
import { EditorialFigure, FaqSection, Hero, ItemsGrid, SchemaScript, StudioShell } from "./studio-parts";

/** The tool section as one wide strip: a waveform trim sketch carrying the
 * three explanations as labelled columns, instead of three equal cards. */
function FeatureStrip({ section }: { section: PageSection }) {
  return (
    <section className="sec feature-strip" id={section.id}>
      <div className="strip-head">
        <h2>{section.title}</h2>
        <p>{section.body}</p>
      </div>
      <div className="strip-body">
        <svg className="trim-sketch" viewBox="0 0 560 120" aria-hidden="true" preserveAspectRatio="none">
          {/* the waveform, with the kept region between the trim markers */}
          <defs>
            <clipPath id="trimKeep">
              <rect x="150" y="0" width="290" height="120" />
            </clipPath>
          </defs>
          <g clipPath="url(#trimKeep)">
            {Array.from({ length: 56 }, (_, i) => {
              const h = 8 + Math.abs(Math.sin(i * 0.55) * 34) + (i % 7) * 1.4;
              return <rect key={i} x={i * 10 + 4} y={60 - h} width="6" height={h * 2} rx="3" fill="var(--accent)" />;
            })}
          </g>
          <g opacity="0.28">
            {Array.from({ length: 56 }, (_, i) => {
              const h = 8 + Math.abs(Math.sin(i * 0.55) * 34) + (i % 7) * 1.4;
              return <rect key={i} x={i * 10 + 4} y={60 - h} width="6" height={h * 2} rx="3" fill="var(--accent)" />;
            })}
          </g>
          <line x1="150" y1="8" x2="150" y2="112" stroke="var(--accent-strong)" strokeWidth="2" />
          <line x1="440" y1="8" x2="440" y2="112" stroke="var(--accent-strong)" strokeWidth="2" />
          <rect x="150" y="4" width="290" height="112" fill="none" stroke="var(--line-strong)" strokeDasharray="6 5" />
        </svg>
        <div className="strip-cols">
          {section.items?.map((item) => (
            <div key={item.title} className="strip-col">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage({ content, config }: NativeRouteProps) {
  const byId = new Map(content.sections.map((s) => [s.id, s]));
  const tool = byId.get("tool");
  const how = byId.get("how-it-works");
  const formats = byId.get("formats");
  const faqSec = byId.get("faq");

  const rest = content.sections
    .filter((s) => !["tool", "how-it-works", "formats", "faq"].includes(s.id))
    .map((section) => <ItemsGrid key={section.id} section={section} />);

  return (
    <>
      <SiteHeader config={config} currentPath="/" />
      <StudioShell>
        <Hero
          content={content}
          blockWord="Reverb"
          voice="Let the last chorus drift."
          voiceSub="Drop in a song, shape it live with speed, pitch and reverb, and export WAV or MP3 — no signup, nothing leaves your browser."
          consoleSlot={<AudioStudio defaultPreset="classic" exportTag="slowed-reverb" />}
          figure={
            content.hero ? (
              <figure className="hero-figure rise">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={content.hero.src} alt={content.hero.alt} />
                <figcaption>
                  <svg viewBox="0 0 26 10" width="22" height="9" aria-hidden="true">
                    <path d="M1 9 C 8 2 18 1 25 4" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                  The last chorus, at 0.8×
                </figcaption>
              </figure>
            ) : null
          }
        />

        {tool ? <FeatureStrip section={tool} /> : null}

        <div className="split-row">
          {how ? (
            <div className="split-main">
              <ItemsGrid section={how} />
            </div>
          ) : null}
          <div className="split-side">{formats ? <ItemsGrid section={formats} /> : null}</div>
        </div>

        {rest}

        {content.faq ? <FaqSection faq={content.faq} title={faqSec?.title ?? "FAQ"} body={faqSec?.body} /> : null}
        {faqSec?.image ? <EditorialFigure image={faqSec.image} /> : null}
      </StudioShell>
      <SiteFooter config={config} currentPath="/" />
      <SchemaScript schema={content.schema} />
    </>
  );
}
