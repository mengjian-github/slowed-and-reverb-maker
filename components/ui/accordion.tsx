// Accordion — single-open disclosure list, no dependency.
// Props: items (required array of { id: string; title: ReactNode; content:
//   ReactNode }), openId (string | null, optional — pass it with onOpenChange
//   to control the open item; omit both and the accordion keeps its own state,
//   starting from defaultOpenId), onOpenChange ((id: string | null) => void,
//   optional — called with the clicked item's id, or null when it was already
//   open), defaultOpenId (optional), className merged via cn().
// A11y: each header is a <button aria-expanded aria-controls>, each panel is
//   role="region" aria-labelledby; closed panels stay in the HTML with the
//   `hidden` attribute, so answers are in the page source for search engines
//   and the copy audit (an unmounted FAQ answer is invisible to both).
// Usage:
//   const [openId, setOpenId] = useState<string | null>(null);
//   <Accordion items={faqs} openId={openId} onOpenChange={setOpenId} />
//   <Accordion items={faqs} />   // uncontrolled
// Style rule: token classes only (border-line, bg-surface, text-muted,
//   outline-accent); the chevron rotates under motion-safe: only.

"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { RichText } from "./rich-text";

export interface AccordionItem {
  id: string;
  /** Frozen copy titles are optional; a missing one renders nothing rather than failing tsc
   *  (Wedding Budget Calculator, 2026-10-14: TS2322 on a mapped FAQ list). */
  title: ReactNode;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  openId?: string | null;
  onOpenChange?: (id: string | null) => void;
  defaultOpenId?: string | null;
  className?: string;
}

export function Accordion({ items, openId: controlledOpenId, onOpenChange, defaultOpenId = null, className }: AccordionProps) {
  const [ownOpenId, setOwnOpenId] = useState<string | null>(defaultOpenId);
  const openId = controlledOpenId !== undefined ? controlledOpenId : ownOpenId;
  const toggle = (id: string | null) => {
    if (controlledOpenId === undefined) setOwnOpenId(id);
    onOpenChange?.(id);
  };
  return (
    // Each item is a filled plate, not rows ruled inside an outline (design inspector, 2026-10-19).
    <div className={cn("grid gap-2", className)}>
      {items.map((item) => {
        const open = item.id === openId;
        const buttonId = `accordion-trigger-${item.id}`;
        const panelId = `accordion-panel-${item.id}`;
        return (
          <div key={item.id} className="overflow-hidden rounded-control bg-surface">
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(open ? null : item.id)}
                className={cn(
                  "flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  "hover:bg-surface-alt motion-safe:transition-colors",
                )}
              >
                <span>{item.title}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-2 w-2 shrink-0 rotate-45 border-b-2 border-r-2 border-muted",
                    "motion-safe:transition-transform",
                    open && "rotate-[225deg]",
                  )}
                />
              </button>
            </h3>
            <div role="region" id={panelId} aria-labelledby={buttonId} hidden={!open} className="px-4 pb-4 text-sm text-muted">
              {/* A FAQ answer is frozen copy: its [links](/path/) and **bold** render, not print as
                  markup (Watercolor Paper Weight Guide, 2026-10-07: QA saw raw "[glossary](/glossary/)"). */}
              {typeof item.content === "string" ? <RichText value={item.content} /> : item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
