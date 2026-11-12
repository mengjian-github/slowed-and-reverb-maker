// Slot — the `asChild` primitive behind Button/Badge (a dependency-free stand-in
// for @radix-ui/react-slot, which the generated site deliberately does not
// install).
//
// `<Button asChild><Link href="/pricing">Pricing</Link></Button>` renders ONE
// element — the child — carrying the button's classes, handlers and a11y props.
// That is the shape every shadcn-trained model reaches for, so the library
// supports it rather than fighting it.
//
// Merge rules (same as Radix's Slot):
//   className → cn(slot, child): the child's utilities win a Tailwind conflict
//   style     → slot then child: child keys win
//   onX       → both run, child's handler first
//   anything else → the child's own value wins
// A non-element child (text, fragment, null) renders nothing: `asChild` is a
// contract for exactly one element child.

import { cloneElement, isValidElement, forwardRef } from "react";
import type { CSSProperties, HTMLAttributes, ReactElement } from "react";
import { cn } from "@/lib/cn";

type SlotChildProps = Record<string, unknown>;

const isEventHandlerName = (name: string): boolean => /^on[A-Z]/.test(name);

function mergeSlotProps(slotProps: SlotChildProps, childProps: SlotChildProps): SlotChildProps {
  // Child props win by default; the three composable keys below are merged.
  const merged: SlotChildProps = { ...slotProps, ...childProps };
  for (const key of Object.keys(slotProps)) {
    const slotValue = slotProps[key];
    const childValue = childProps[key];
    if (isEventHandlerName(key) && typeof slotValue === "function") {
      merged[key] =
        typeof childValue === "function"
          ? (...args: unknown[]) => {
              (childValue as (...called: unknown[]) => unknown)(...args);
              (slotValue as (...called: unknown[]) => unknown)(...args);
            }
          : slotValue;
    } else if (key === "className") {
      merged[key] = cn(slotValue as string | undefined, childValue as string | undefined);
    } else if (key === "style") {
      merged[key] = { ...(slotValue as CSSProperties), ...(childValue as CSSProperties) };
    }
  }
  return merged;
}

export type SlotProps = HTMLAttributes<HTMLElement>;

export const Slot = forwardRef<HTMLElement, SlotProps>(function Slot({ children, ...slotProps }, ref) {
  if (!isValidElement(children)) return null;
  const child = children as ReactElement<SlotChildProps>;
  const merged = mergeSlotProps(slotProps as SlotChildProps, child.props);
  if (ref) merged.ref = ref;
  return cloneElement(child, merged as Partial<SlotChildProps> & { key?: string | null });
});
