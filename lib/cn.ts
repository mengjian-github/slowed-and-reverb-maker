// cn() — the one className combinator for the component library.
// Combines clsx (conditional class joining) with tailwind-merge (conflicting
// Tailwind utilities resolve to the last one), so callers can always override
// a component's default classes via its className prop.
//
// Usage: cn("bg-surface", isActive && "bg-accent-soft", className)

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
