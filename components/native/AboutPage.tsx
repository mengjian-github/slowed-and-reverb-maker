"use client";

import type { Route, SiteConfig } from "@/lib/site-config";
import type { PageContent } from "@/lib/content";
import { CheckedLine, CtaRow, FaqList, HeroCopy, PageShell, Sections } from "./PageShell";

type NativeRouteProps = { route: Route; content: PageContent; config: SiteConfig };

const NODES = [
  { id: "load", title: "Your file", note: "stays in the tab" },
  { id: "shape", title: "Audio graph", note: "speed, pitch, reverb, bass" },
  { id: "render", title: "WAV or MP3", note: "downloaded, unwatermarked" },
];

export function AboutPage({ content, config }: NativeRouteProps) {
  return (
    <PageShell config={config}>
      <section className="hero-band">
        <HeroCopy content={content} />
        <CtaRow content={content} />
        <CheckedLine content={content} />
      </section>

      <section className="flow-band" aria-label="Where your audio goes">
        <p className="flow-caption">One browser tab, start to finish</p>
        <ol className="flow-strip">
          {NODES.map((node, index) => (
            <li key={node.id}>
              <span className="flow-node" aria-hidden="true">
                <svg viewBox="0 0 40 40">
                  <rect x="1" y="1" width="38" height="38" rx="4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  {index === 0 ? <path d="M10 20h20M22 13l8 7-8 7" fill="none" stroke="currentColor" strokeWidth="1.8" /> : null}
                  {index === 1 ? <g stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 26v-8M18 30V10M24 24v-4M28 28v-6" /></g> : null}
                  {index === 2 ? <path d="M20 11v14m-6-6 6 6 6-6M11 30h18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /> : null}
                </svg>
              </span>
              <span className="flow-title">{node.title}</span>
              <span className="flow-note">{node.note}</span>
              {index < NODES.length - 1 ? <span className="flow-link" aria-hidden="true" /> : null}
            </li>
          ))}
        </ol>
      </section>

      <Sections content={content} />
      <FaqList content={content} />
    </PageShell>
  );
}
