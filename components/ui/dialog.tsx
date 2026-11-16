// Dialog — controlled modal built on a div with role="dialog" (no portal, no
//   dependency). Renders nothing while closed.
// Props: open (boolean, required), onOpenChange (open: boolean) => void,
//   required — called on ESC, backdrop click and the built-in close button),
//   title (string, optional — wired as aria-labelledby), description (string,
//   optional — wired as aria-describedby), className (panel classes, merged
//   via cn()), children (panel body).
// Behavior: ESC closes, backdrop click closes, Tab is trapped inside the
//   panel, focus moves into the panel on open and returns to the previously
//   focused element on close, body scroll locks while open.
// Usage:
//   <Dialog open={open} onOpenChange={setOpen} title="Delete site" description="This cannot be undone.">
//     <Button variant="destructive" onClick={remove}>Delete</Button>
//   </Dialog>
// Style rule: token classes only (bg-surface, border-line, bg-background scrim
//   with opacity, rounded-panel, text-muted).

"use client";

import { useEffect, useId, useRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface DialogProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: ReactNode;
}

export function Dialog({ open, onOpenChange, title, description, className, children, id, ...props }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const dialogId = id ?? reactId;

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Move focus into the dialog: first focusable control, else the panel.
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onOpenChange(false);
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const firstItem = focusable[0];
      const lastItem = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === firstItem || active === panel)) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && active === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-background/80"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        id={dialogId}
        aria-labelledby={title ? `${dialogId}-title` : undefined}
        aria-describedby={description ? `${dialogId}-description` : undefined}
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full max-w-lg rounded-panel border border-line bg-surface p-6 text-foreground shadow-lg",
          "focus-visible:outline-none",
          className,
        )}
        {...props}
      >
        <button
          type="button"
          aria-label="Close dialog"
          onClick={() => onOpenChange(false)}
          className={cn(
            "absolute right-3 top-3 inline-flex min-h-9 min-w-9 items-center justify-center rounded-control text-muted",
            "hover:bg-accent-soft hover:text-accent-ink",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            "motion-safe:transition-colors",
          )}
        >
          <span aria-hidden="true" className="text-lg leading-none">×</span>
        </button>
        {title ? (
          <h2 id={`${dialogId}-title`} className="pr-10 text-lg font-semibold leading-snug">
            {title}
          </h2>
        ) : null}
        {description ? (
          <p id={`${dialogId}-description`} className="mt-1 pr-10 text-sm text-muted">
            {description}
          </p>
        ) : null}
        <div className={title || description ? "mt-4" : undefined}>{children}</div>
      </div>
    </div>
  );
}
