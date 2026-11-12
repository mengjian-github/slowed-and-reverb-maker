"use client";

// /nightcore-maker/ — the same engine tuned for the sped-up style: console
// beside the step rail and style explanation, styles table, then FAQ.

import SiteFooter, { SiteHeader } from "@/components/site/SiteChrome";

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
        />

        {tool ? <ItemsGrid section={tool} /> : null}

        <div className="split-row">
          <div className="split-main">{how ? <StepsColumn section={how} /> : null}</div>
          <div className="split-side">{styles ? <ItemsGrid section={styles} /> : null}</div>
        </div>

        {rest}

        {content.faq ? <FaqSection faq={content.faq} title={faqSec?.title ?? "Nightcore FAQ"} body={faqSec?.body} /> : null}
      </StudioShell>
      <SiteFooter config={config} />
      <SchemaScript schema={content.schema} />
    </>
  );
}
