// Checkbox — shadcn/ui-style styled native checkbox.
// Props: every native <input type="checkbox"> attribute (id, name, checked,
//   defaultChecked, onChange, required, disabled, aria-*, ...); className
//   merges over the defaults via cn(). Ref forwards to the <input>.
// Label association: pair with <label htmlFor> (or FormField, which wires it);
//   wrap both in a flex row for the classic checkbox+label line.
// Usage: <Checkbox id="terms" required /> <label htmlFor="terms">I agree</label>
// onCheckedChange(checked) is accepted too, so the shadcn/Radix call shape
//   authors reach for (<Checkbox onCheckedChange={setOn} />) compiles and works;
//   it fires alongside any onChange.
// Style rule: the accent-color CSS property paints the native check with the
//   accent token (accent-accent utility) — no custom box, no hard-coded colors.

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, onChange, onCheckedChange, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-5 w-5 shrink-0 cursor-pointer accent-accent",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
      onChange={(event) => {
        onChange?.(event);
        onCheckedChange?.(event.currentTarget.checked);
      }}
    />
  );
});
