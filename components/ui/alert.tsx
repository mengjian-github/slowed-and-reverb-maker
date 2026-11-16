// Alert — shadcn/ui-style inline message strip.
// Props: variant ("info" | "ok" | "warn" | "bad" | "destructive", default
//   "info"; "default" is accepted as an alias of "info" and "destructive" of
//   "bad" — shadcn's spelling), title (optional string heading), children (body
//   copy), plus native <div> attributes; className merges via cn(). Ref
//   forwards to the wrapper.
// Live-region contract: the "bad"/"destructive" variants render role="alert"
//   (assertive — announced immediately); every other variant renders
//   role="status" (polite). Do not override unless you know why.
// Usage: <Alert variant="warn" title="Usage limit">You are close to the plan cap.</Alert>
// Style rule: token classes only; status tints use the pre-flighted
//   bg-*-soft / text-*-ink / border-*-line pairs, never an alpha modifier
//   on the fill hue and never a hard-coded hex.

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

// "default" and "destructive" are shadcn's own spellings, accepted as aliases
// so the habitual shape compiles instead of failing the build gate.
export type AlertVariant = "info" | "ok" | "warn" | "bad" | "default" | "destructive";

const variants: Record<AlertVariant, string> = {
  info: "border-accent-line bg-accent-soft text-foreground",
  default: "border-accent-line bg-accent-soft text-foreground",
  ok: "border-ok-line bg-ok-soft text-foreground",
  warn: "border-warn-line bg-warn-soft text-foreground",
  bad: "border-bad-line bg-bad-soft text-foreground",
  destructive: "border-bad-line bg-bad-soft text-foreground",
};

const titleInk: Record<AlertVariant, string> = {
  info: "text-accent-ink",
  default: "text-accent-ink",
  ok: "text-ok-ink",
  warn: "text-warn-ink",
  bad: "text-bad-ink",
  destructive: "text-bad-ink",
};

const ASSERTIVE_VARIANTS: readonly AlertVariant[] = ["bad", "destructive"];

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { variant = "info", title, className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role={ASSERTIVE_VARIANTS.includes(variant) ? "alert" : "status"}
      className={cn("rounded-control border px-4 py-3 text-sm", variants[variant], className)}
      {...props}
    >
      {title ? <p className={cn("font-semibold", titleInk[variant])}>{title}</p> : null}
      {children ? <div className={cn("text-foreground", title ? "mt-1" : undefined)}>{children}</div> : null}
    </div>
  );
});
