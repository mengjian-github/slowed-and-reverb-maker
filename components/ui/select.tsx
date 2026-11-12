// Select — shadcn/ui-style styled native <select>.
// Props: every native <select> attribute (id, name, value, defaultValue,
//   onChange, required, disabled, aria-*, ...); options are plain <option>
//   children; className merges over the defaults via cn(). Ref forwards to
//   the <select>. Native select keeps the platform popup, keyboard model and
//   mobile sheet for free — no custom listbox to get wrong.
// Usage:
//   <Select id="plan" defaultValue="pro">
//     <option value="free">Free</option>
//     <option value="pro">Pro</option>
//   </Select>
// onValueChange(value) is accepted too (the shadcn/Radix call shape); it
//   fires alongside any onChange with the selected option's value.
// Style rule: token classes only; the chevron is a border-drawn glyph, so no
//   icon dependency and no hard-coded colors.

import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, onChange, onValueChange, ...props },
  ref,
) {
  return (
    <span className="relative inline-flex w-full">
      <select
        ref={ref}
        data-part="field"
        className={cn(
          "min-h-11 w-full appearance-none rounded-control border border-line bg-surface px-3 py-2 pr-9 text-sm text-foreground",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:border-accent-line",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-bad",
          "motion-safe:transition-colors",
          className,
        )}
        {...props}
        onChange={(event) => {
          onChange?.(event);
          onValueChange?.(event.currentTarget.value);
        }}
      >
        {children}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-2 w-2 -translate-y-2/3 rotate-45 border-b-2 border-r-2 border-muted"
      />
    </span>
  );
});
