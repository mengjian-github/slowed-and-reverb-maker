// Section — page-level building blocks for long SEO pages that still read as
// designed pages (the Wise / Smallpdf / Ahrefs anatomy: short leads beside
// visuals, numbered steps, trust points, feature grids and an FAQ whose every
// answer stays in the HTML). Server-safe: no state, no effects.
// Exports: Section, SectionHeader, SplitFeature, Steps, TrustPoints,
//   FeatureGrid, Faq.
// Usage:
//   <Section tone="band">
//     <SectionHeader title="Split a bill in three steps" lead="..." />
//     <Steps items={[{ title: "Enter the bill", body: "..." }]} />
//   </Section>
//   <SplitFeature title="Tax before or after" visual={<MiniExample />} reverse>
//     <RichText value={section.body} />
//   </SplitFeature>
// Style rule: token classes only; type comes from the semantic ladder
//   (text-title, text-heading, text-lead). A surface is defined by its fill,
//   never a 1px outline, and nothing sits above a heading: outlines, hairline
//   dividers, eyebrow labels and icon-topped card rows are the tells the
//   design inspector fails (shared/qa-taste-findings.ts, 2026-10-19).

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SectionTone = "plain" | "band" | "accent";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  /** plain: page ground; band: surface plate; accent: soft accent plate. */
  tone?: SectionTone;
}

export function Section({ tone = "plain", className, ...props }: SectionProps) {
  return (
    <section
      data-tone={tone}
      className={cn(
        "grid gap-group py-section",
        tone === "band" && "rounded-panel bg-surface px-group",
        tone === "accent" && "rounded-panel bg-accent-soft px-group",
        className,
      )}
      {...props}
    />
  );
}

export interface SectionHeaderProps {
  title: ReactNode;
  /** Accepted for older callers and not rendered: put its words in the title or the lead. */
  eyebrow?: ReactNode;
  lead?: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}

export function SectionHeader({ title, lead, as = "h2", className }: SectionHeaderProps) {
  const Heading = as;
  return (
    <header className={cn("grid max-w-3xl gap-related", className)}>
      <Heading className={cn("font-bold text-balance text-foreground", as === "h1" ? "text-display" : as === "h3" ? "text-heading" : "text-title")}>{title}</Heading>
      {lead ? <div className="text-lead text-muted">{lead}</div> : null}
    </header>
  );
}

export interface SplitFeatureProps {
  title: ReactNode;
  children?: ReactNode;
  /** The visual beside the text: an icon tile, an image, a live mini-example or a small chart. */
  visual: ReactNode;
  /** Put the visual first; alternate it down the page. */
  reverse?: boolean;
  /** Accepted for older callers and not rendered. */
  eyebrow?: ReactNode;
  id?: string;
  className?: string;
}

export function SplitFeature({ title, children, visual, reverse = false, id, className }: SplitFeatureProps) {
  return (
    <section id={id} className={cn("grid items-center gap-group py-group md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]", reverse && "md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]", className)}>
      <div className={cn("grid min-w-0 gap-related", reverse && "md:order-2")}>
        <h2 className="text-title font-bold text-balance text-foreground">{title}</h2>
        {children ? <div className="grid gap-related text-foreground">{children}</div> : null}
      </div>
      <div className={cn("grid min-h-40 min-w-0 place-items-center rounded-panel bg-surface p-group text-accent-ink", reverse && "md:order-1")}>
        {visual}
      </div>
    </section>
  );
}

export interface StepsProps {
  items: { title: ReactNode; body?: ReactNode }[];
  className?: string;
}

export function Steps({ items, className }: StepsProps) {
  return (
    <ol className={cn("grid gap-group sm:grid-cols-2 lg:grid-cols-4", className)}>
      {items.map((item, index) => (
        <li key={index} className="grid content-start gap-related">
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-accent font-bold text-on-accent">{index + 1}</span>
          <h3 className="text-heading font-semibold text-foreground">{item.title}</h3>
          {item.body ? <div className="text-muted">{item.body}</div> : null}
        </li>
      ))}
    </ol>
  );
}

export interface TrustPointsProps {
  items: ReactNode[];
  className?: string;
}

export function TrustPoints({ items, className }: TrustPointsProps) {
  return (
    <ul className={cn("flex flex-wrap gap-x-group gap-y-related text-sm font-medium text-foreground", className)}>
      {items.map((item, index) => (
        <li key={index} className="flex items-center gap-2">
          <svg aria-hidden="true" viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="text-accent-ink">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export interface FeatureGridProps {
  items: { title: ReactNode; body?: ReactNode; icon?: ReactNode }[];
  columns?: 2 | 3;
  className?: string;
}

export function FeatureGrid({ items, columns = 3, className }: FeatureGridProps) {
  return (
    <ul className={cn("grid gap-group sm:grid-cols-2", columns === 3 && "lg:grid-cols-3", className)}>
      {items.map((item, index) => (
        <li key={index} className="grid content-start gap-related">
          <h3 className="flex items-baseline gap-2 text-heading font-semibold text-foreground">
            {item.icon ? <span aria-hidden="true" className="shrink-0 text-accent-ink">{item.icon}</span> : null}
            <span>{item.title}</span>
          </h3>
          {item.body ? <div className="text-muted">{item.body}</div> : null}
        </li>
      ))}
    </ul>
  );
}

// A question/answer pair; the Accordion's { title, content } and a section's
// { title, body } read the same. Two builds passed Accordion-shaped items to
// Faq on one day and failed their type check (Mortgage Points, Fantasy Trade,
// 2026-10-21).
export type FaqItem =
  | { question: ReactNode; answer: ReactNode }
  | { title: ReactNode; content: ReactNode }
  | { title: ReactNode; body: ReactNode };

export interface FaqProps {
  items: FaqItem[];
  className?: string;
}

function faqQuestion(item: FaqItem): ReactNode {
  return "question" in item ? item.question : item.title;
}

function faqAnswer(item: FaqItem): ReactNode {
  return "answer" in item ? item.answer : "content" in item ? item.content : item.body;
}

/** Every answer stays in the HTML (details/summary), so search engines index it while the page stays short. */
export function Faq({ items, className }: FaqProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      {items.map((item, index) => (
        <details key={index} className="group rounded-control bg-surface px-group py-related">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-group font-semibold text-foreground">
            <span>{faqQuestion(item)}</span>
            <span aria-hidden="true" className="text-accent-ink motion-safe:transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="pt-related text-muted">{faqAnswer(item)}</div>
        </details>
      ))}
    </div>
  );
}
