// Input — shadcn/ui-style single-line text field.
// Props: every native <input> attribute (id, name, type, value, defaultValue,
//   placeholder, required, disabled, aria-invalid, aria-describedby, ...);
//   className merges over the defaults via cn(). Ref forwards to the <input>.
// Label association: pair with <label htmlFor> (or FormField, which wires it).
// Usage: <Input id="email" type="email" placeholder="you@example.com" required />
// Style rule: token classes only (bg-surface, border-line, rounded-control,
//   text-muted placeholder, outline-accent focus ring).

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      data-part="field"
      type={type}
      className={cn(
        "flex min-h-11 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-foreground",
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
