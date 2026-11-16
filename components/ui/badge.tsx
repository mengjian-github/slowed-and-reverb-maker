// Badge — shadcn/ui-style status label / tag.
// Props: variant ("default" | "secondary" | "outline" | "ok" | "warn" | "bad"
//   | "destructive", default "default"; "destructive" is shadcn's spelling of
//   "bad"), asChild (boolean, render the single child element — a <Link>, an
//   <a> — instead of the <span>), plus every native <span> attribute; className
//   merges over the defaults via cn(). Ref forwards to the rendered element.
// Usage: <Badge variant="ok">Published</Badge>
// Style rule: token classes only — status variants use the pre-flighted
//   ok/warn/bad soft plates and inks (bg-warn-soft text-warn-ink), never an
//   alpha modifier on the fill hue and never a hard-coded hex.

import { forwardRef, type ElementType, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Slot } from "./slot";

export type BadgeVariant = "default" | "secondary" | "outline" | "ok" | "warn" | "bad" | "destructive";

const variants: Record<BadgeVariant, string> = {
  default: "border-accent-line bg-accent-soft text-accent-ink",
  secondary: "border-line bg-surface-alt text-muted",
  outline: "border-line bg-transparent text-foreground",
  ok: "border-ok-line bg-ok-soft text-ok-ink",
  warn: "border-warn-line bg-warn-soft text-warn-ink",
  bad: "border-bad-line bg-bad-soft text-bad-ink",
  destructive: "border-bad-line bg-bad-soft text-bad-ink",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Render the single child element as the badge (links, next/link <Link>). */
  asChild?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = "default", className, asChild = false, ...props },
  ref,
) {
  const Tag: ElementType = asChild ? Slot : "span";
  return (
    <Tag
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-5",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
