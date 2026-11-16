"use client";

import type { Route, SiteConfig } from "@/lib/site-config";
import type { PageContent } from "@/lib/content";
import { CtaRow, FaqList, HeroCopy, PageShell, Sections } from "./PageShell";

type NativeRouteProps = { route: Route; content: PageContent; config: SiteConfig };

export function GuidePage({ content, config }: NativeRouteProps) {
  return (
    <PageShell config={config}>
      <div className="stage stage-text">
        <HeroCopy content={content} kicker="Guide" />
        <CtaRow content={content} />
      </div>
      <Sections content={content} />
      <FaqList content={content} />
    </PageShell>
  );
}

export function ComparePage({ content, config }: NativeRouteProps) {
  return (
    <PageShell config={config}>
      <div className="stage stage-text">
        <HeroCopy content={content} kicker="Two directions, one engine" />
        <CtaRow content={content} />
      </div>
      <Sections content={content} />
      <FaqList content={content} />
    </PageShell>
  );
}

export function AboutPage({ content, config }: NativeRouteProps) {
  return (
    <PageShell config={config}>
      <div className="stage stage-text">
        <HeroCopy content={content} kicker="About the tool" />
        <CtaRow content={content} />
      </div>
      <Sections content={content} />
      <FaqList content={content} />
    </PageShell>
  );
}

export function LegalPage({ content, config, kicker }: NativeRouteProps & { kicker: string }) {
  return (
    <PageShell config={config}>
      <div className="stage stage-text">
        <HeroCopy content={content} kicker={kicker} />
        <CtaRow content={content} />
      </div>
      <Sections content={content} />
      <FaqList content={content} />
    </PageShell>
  );
}

export function PrivacyPage(props: NativeRouteProps) {
  return <LegalPage {...props} kicker="Privacy" />;
}

export function TermsPage(props: NativeRouteProps) {
  return <LegalPage {...props} kicker="Terms" />;
}

export function ContactPage({ content, config }: NativeRouteProps) {
  return (
    <PageShell config={config}>
      <div className="stage stage-text">
        <HeroCopy content={content} kicker="Contact" />
        <CtaRow content={content} />
      </div>
      <Sections content={content} />
    </PageShell>
  );
}
