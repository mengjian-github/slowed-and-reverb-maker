// Textarea — shadcn/ui-style multi-line text field.
// Props: every native <textarea> attribute (id, name, rows, value,
//   defaultValue, placeholder, required, disabled, aria-*, ...); className
//   merges over the defaults via cn(). Ref forwards to the <textarea>.
// Label association: pair with <label htmlFor> (or FormField, which wires it).
// Usage: <Textarea id="bio" rows={4} placeholder="Tell us about your project" />
// Style rule: token classes only, same ring/border language as Input.

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 3, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      data-part="field"
      rows={rows}
      className={cn(
        "flex min-h-20 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-foreground",
        "placeholder:text-muted",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:border-accent-line",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-bad",
        "motion-safe:transition-colors",
        className,
      )}
      {...props}
    />
  );
});
