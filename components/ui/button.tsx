// Button — shadcn/ui-style button with variant/size maps and `asChild`.
// Props: variant ("primary" | "secondary" | "outline" | "ghost" | "destructive"
//   | "link", default "primary"; "default" is accepted as an alias of
//   "primary"), size ("sm" | "md" | "lg" | "icon", default "md"; "default" is
//   accepted as an alias of "md"), asChild (boolean, default false), plus every
//   native <button> attribute (type, disabled, onClick, aria-*, ...); className
//   merges over the defaults via cn(). Ref forwards to the rendered element.
// Usage: <Button variant="primary" size="lg" onClick={save}>Save</Button>
//        <Button asChild><Link href="/pricing">Pricing</Link></Button>
// asChild renders the single child element (a next/link <Link>, an <a>, ...)
//   carrying the button classes instead of nesting a <button> inside it — the
//   only correct way to make a link look like a button.
// Style rule: semantic token classes only (bg-accent, text-on-accent,
//   border-line, rounded-control, outline-accent) — never hard-coded colors.

import { forwardRef, type ButtonHTMLAttributes, type Ref } from "react";
import { cn } from "@/lib/cn";
import { Slot } from "./slot";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "link"
  // shadcn/ui spells the filled default "default"; accepted as an alias so the
  // shape a model reaches for by habit compiles instead of failing the gate.
  | "default";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "default";

const base =
  "inline-flex max-w-full min-w-0 items-center justify-center gap-2 whitespace-normal font-semibold rounded-control border border-transparent " +
  // Press feedback (Emil Kowalski): scale(0.97) over 160ms on a strong
  // ease-out, no bounce. A control pressed tens of times a day must answer
  // instantly and settle without overshoot.
  "cursor-pointer select-none motion-safe:transition-[color,background-color,border-color,opacity,transform] motion-safe:duration-[var(--duration-press)] motion-safe:ease-[var(--ease-press)] motion-safe:active:scale-[0.97] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  // The site's one loud action: accent fill with the token that guarantees
  // readable ink on it.
  primary: "bg-accent text-on-accent border-accent hover:opacity-90",
  default: "bg-accent text-on-accent border-accent hover:opacity-90",
  // Quiet accent-tinted action for secondary CTAs.
  secondary: "bg-accent-soft text-accent-ink border-accent-line hover:bg-accent-line",
  // Neutral framed action that inherits the surrounding text color.
  outline: "bg-transparent border-line hover:bg-surface-alt hover:border-accent-line",
  // Frameless action for dense toolbars and inline rows.
  ghost: "bg-transparent hover:bg-accent-soft hover:text-accent-ink",
  // Destructive keeps the status hue; on-accent doubles as the ink token for
  // saturated fills (it is chosen for contrast against strong colors).
  destructive: "bg-bad text-on-accent border-bad hover:opacity-90",
  // Text-weight action that reads as a link but keeps the button hit target.
  link: "bg-transparent text-accent-ink underline underline-offset-4 hover:opacity-80",
};

const sizes: Record<ButtonSize, string> = {
  // 44px like every other size: the build check holds each call to action
  // and tool button to a 44px target, and at 36px the small size failed it on
  // every route that used one (Lyric Generator's sign-in action, 2026-11-12).
  // Small here means tighter padding, not a shorter target.
  sm: "min-h-11 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  default: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-6 text-base",
  // Square target for an icon-only action; pair with an aria-label.
  icon: "min-h-11 w-11 px-0 text-sm",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Render the single child element as the button (links, next/link <Link>). */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, asChild = false, type, ...props },
  ref,
) {
  const classes = cn(base, variants[variant], sizes[size], className);
  if (asChild) {
    // No `type` here: it is a <button> attribute and the child is an anchor.
    return <Slot ref={ref as unknown as Ref<HTMLElement>} className={classes} data-part="button" data-variant={variant} {...props} />;
  }
  // data-part / data-variant are the hooks the site's component skin styles
  // (engine/src/component-skins.ts); the classes stay the default look.
  return <button ref={ref} type={type ?? "button"} className={classes} data-part="button" data-variant={variant} {...props} />;
});
