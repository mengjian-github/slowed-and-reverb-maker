// Tool stage — a tool home's first screen: the headline, one sentence and the
// working tool set as a crafted card on one full-bleed field of the brand
// colour (--stage / --on-stage), the grammar of Wise's converter, NerdWallet
// and Coolors. The look lives in the platform stylesheet (.tool-stage, .tool-card,
// .tool-answer, .tool-breakdown), so every site gets the same craft floor in
// its own colours. Server-safe: no state, no effects; the interactive tool
// inside it lives in its own client component file.
// Exports: ToolStage, ToolCard, ToolAnswer, Breakdown.
// Usage:
//   <ToolStage title={hero.title} lead={hero.subtitle} visual={<img src="/images/hero.webp" alt="..." />}>
//     <SplitBillTool />
//   </ToolStage>
//   // inside the tool's own client component:
//   <ToolCard data-capability="split" data-operation="calculate" data-state={state}
//     inputs={<>...labelled fields and the primary button...</>}
//     answer={<div data-tool-output>
//       <ToolAnswer label="Each person pays" value={fmt(each)} detail="Tip included" />
//       <Breakdown items={[{ label: "Food", value: 84, display: "$84.00" }]} />
//     </div>} />
// Rules: the answer is computed from the visible defaults, so the card shows
//   a real result on arrival; ToolAnswer is for a numeric answer — a result
//   whose natural form is not a number (a palette, a converted file, a chart)
//   goes in the answer slot as itself. Long copy goes below the stage.

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ToolStageProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** The page's keyword headline; rendered as the page h1. */
  title: ReactNode;
  /** One sentence under the headline. */
  lead?: ReactNode;
  /** A short line under the lead: sources, the date checked, who it is for. */
  meta?: ReactNode;
  /** The site's own picture of its subject; sits beside the headline and after the tool on phones. */
  visual?: ReactNode;
}

/** The title's width in em at display size, plus word-break slack: CJK glyphs are one em, Latin about 0.56. */
function titleEm(title: ReactNode): number | null {
  if (typeof title !== "string" || !title.trim()) return null;
  let em = 0;
  for (const char of title.trim()) em += /[⺀-鿿가-힯豈-﫿＀-￯]/.test(char) ? 1 : 0.56;
  return Math.round(em * 1.18 * 100) / 100;
}

export function ToolStage({ title, lead, meta, visual, children, className, style, ...props }: ToolStageProps) {
  const em = titleEm(title);
  return (
    <section data-stage="tool" data-visual={visual ? "" : undefined} className={cn("tool-stage", className)}
      style={em ? ({ ...style, "--stage-title-em": em } as CSSProperties) : style} {...props}>
      <div className="tool-stage-top">
        <div className="tool-stage-head">
          <h1>{title}</h1>
          {lead ? <p className="tool-stage-lead">{lead}</p> : null}
          {meta ? <p className="tool-stage-meta">{meta}</p> : null}
        </div>
        {visual ? <figure className="tool-stage-visual">{visual}</figure> : null}
      </div>
      {children}
    </section>
  );
}

export interface ToolCardProps extends HTMLAttributes<HTMLElement> {
  /** The labelled fields and the primary action. */
  inputs: ReactNode;
  /** The live result; wrap it in the element that carries data-tool-output. */
  answer: ReactNode;
  /** stacked puts the answer under the inputs (a tool with one wide field). */
  layout?: "split" | "stacked";
  /** form renders a <form> whose native submit (a page reload) is always prevented; onSubmit runs the tool. */
  as?: "div" | "form";
}

export function ToolCard({ inputs, answer, layout = "split", as = "div", className, onSubmit, ...props }: ToolCardProps) {
  const Root = as;
  const submit: HTMLAttributes<HTMLElement>["onSubmit"] = as === "form"
    ? (event) => {
      event.preventDefault();
      onSubmit?.(event);
    }
    : onSubmit;
  return (
    <Root data-layout={layout} className={cn("tool-card", className)} onSubmit={submit} {...(props as HTMLAttributes<HTMLElement>)}>
      <div className="tool-card-inputs">{inputs}</div>
      <div className="tool-card-answer" aria-live="polite">{answer}</div>
    </Root>
  );
}

export interface ToolAnswerProps {
  label: ReactNode;
  /** The formatted answer, e.g. "$1,240" or "7.4 years". */
  value: ReactNode;
  /** One line under it: the range, the unit, what it includes. */
  detail?: ReactNode;
  className?: string;
}

export function ToolAnswer({ label, value, detail, className }: ToolAnswerProps) {
  return (
    <p className={cn("tool-answer", className)}>
      <span className="tool-answer-label">{label}</span>
      <output className="tool-answer-value">{value}</output>
      {detail ? <span className="tool-answer-detail">{detail}</span> : null}
    </p>
  );
}

export interface BreakdownProps {
  /** value drives the bar length; display is the text shown beside it. */
  items: { label: ReactNode; value: number; display: ReactNode }[];
  className?: string;
}

/** The parts of the answer as bars, the numbers always in text beside them. */
export function Breakdown({ items, className }: BreakdownProps) {
  const max = Math.max(1, ...items.map((item) => (Number.isFinite(item.value) ? Math.abs(item.value) : 0)));
  return (
    <ul className={cn("tool-breakdown", className)}>
      {items.map((item, index) => {
        const share = Number.isFinite(item.value) ? Math.max(2, (Math.abs(item.value) / max) * 100) : 0;
        return (
          <li key={index}>
            <span className="tool-breakdown-name">{item.label}</span>
            <span className="tool-breakdown-track" aria-hidden="true"><i style={{ "--share": `${share.toFixed(1)}%` } as CSSProperties} /></span>
            <span className="tool-breakdown-value">{item.display}</span>
          </li>
        );
      })}
    </ul>
  );
}
