// Skeleton — loading placeholder block.
// Props: every native <div> attribute; size and shape come entirely from
//   className (h-*, w-*, rounded-*), merged via cn(). Ref forwards to the div.
// The pulse animation runs only under motion-safe:, so reduced-motion users
//   get a static plate.
// Usage: <Skeleton className="h-4 w-2/3" /> — pair several to sketch a card.
// Style rule: bg-surface-alt is a token class; aria-hidden keeps placeholders
//   out of the accessibility tree.

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Skeleton = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Skeleton(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("rounded-control bg-surface-alt motion-safe:animate-pulse", className)}
      {...props}
    />
  );
});
