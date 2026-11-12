"use client";

// / — Slowed and Reverb Maker: hero with the console on the first screen,
// then sections in approved order (tool → how-it-works + formats → faq).

import SiteFooter, { SiteHeader } from "@/components/site/SiteChrome";

import type { NativeRouteProps } from "./registry";
import AudioStudio from "./AudioStudio";
import { EditorialFigure, FaqSection, Hero, ItemsGrid, SchemaScript, StudioShell } from "./studio-parts";

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

        {tool ? <ItemsGrid section={tool} /> : null}

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
      <SiteFooter config={config} />
      <SchemaScript schema={content.schema} />
    </>
  );
}
