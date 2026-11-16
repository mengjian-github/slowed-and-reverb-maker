"use client";

import type { Route, SiteConfig } from "@/lib/site-config";
import type { PageContent } from "@/lib/content";
import { CheckedLine, CtaRow, FaqList, HeroCopy, PageShell, Sections } from "./PageShell";

type NativeRouteProps = { route: Route; content: PageContent; config: SiteConfig };

function DocLayout({ content, config }: NativeRouteProps) {
  const sections = content.sections ?? [];
  return (
    <PageShell config={config}>
      <div className="doc-shell">
        <aside className="doc-toc" aria-label="On this page">
          <p className="doc-toc-title">On this page</p>
          <ol>
            {sections.map((section) => (
              <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>
            ))}
            {content.faq?.length ? <li><a href="#faq">Questions</a></li> : null}
          </ol>
          {content.ctas?.length ? <div className="doc-toc-cta"><CtaRow content={content} /></div> : null}
        </aside>
        <div className="doc-body">
          <header className="doc-head">
            <h1>{content.h1}</h1>
            <p className="lede">{content.heroText}</p>
            <CheckedLine content={content} />
          </header>
          <Sections content={content} />
          <FaqList content={content} />
        </div>
      </div>
    </PageShell>
  );
}

export function PrivacyPage(props: NativeRouteProps) {
  return <DocLayout {...props} />;
}

export function TermsPage(props: NativeRouteProps) {
  return <DocLayout {...props} />;
}

export function ContactPage({ content, config }: NativeRouteProps) {
  return (
    <PageShell config={config}>
      <section className="hero-band">
        <HeroCopy content={content} />
        {content.ctas?.length ? <CtaRow content={content} /> : null}
        <CheckedLine content={content} />
      </section>
      <Sections content={content} />
      <FaqList content={content} />
    </PageShell>
  );
}
