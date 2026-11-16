// Card — shadcn/ui-style surface container with composition slots.
// Exports: Card, CardHeader, CardTitle, CardDescription, CardContent,
//   CardFooter. Each is a forwardRef wrapper around a div (CardTitle is an h3)
//   that accepts all native attributes, merges className via cn(), and takes
//   `asChild` to render its single child element instead of its own tag —
//   <CardTitle asChild><h2>Plan</h2></CardTitle> when the heading level has to
//   change.
// Usage:
//   <Card>
//     <CardHeader><CardTitle>Plan</CardTitle><CardDescription>Per month</CardDescription></CardHeader>
//     <CardContent>...</CardContent>
//     <CardFooter><Button>Choose</Button></CardFooter>
//   </Card>
// Style rule: token classes only (bg-surface, border-line, rounded-panel,
//   text-muted); shadow-sm is a built-in Tailwind utility, not a color.

import { forwardRef, type ElementType, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Slot } from "./slot";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Render the single child element instead of this slot's own tag. */
  asChild?: boolean;
}

export type CardTitleProps = HTMLAttributes<HTMLHeadingElement> & { asChild?: boolean };
export type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement> & { asChild?: boolean };

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, asChild = false, ...props },
  ref,
) {
  const Tag: ElementType = asChild ? Slot : "div";
  return (
    <Tag
      ref={ref}
      data-part="card"
      // A surface by its fill, not a hairline plus a resting shadow (Impeccable
      // gpt-thin-border-wide-shadow; surfaces-by-fill, #1976).
      className={cn("rounded-panel bg-surface text-foreground", className)}
      {...props}
    />
  );
});

export const CardHeader = forwardRef<HTMLDivElement, CardProps>(function CardHeader(
  { className, asChild = false, ...props },
  ref,
) {
  const Tag: ElementType = asChild ? Slot : "div";
  return <Tag ref={ref} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
});

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(function CardTitle(
  { className, asChild = false, ...props },
  ref,
) {
  const Tag: ElementType = asChild ? Slot : "h3";
  return (
    <Tag
      ref={ref}
      className={cn("text-lg font-semibold leading-snug tracking-tight", className)}
      {...props}
    />
  );
});

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  function CardDescription({ className, asChild = false, ...props }, ref) {
    const Tag: ElementType = asChild ? Slot : "p";
    return <Tag ref={ref} className={cn("text-sm text-muted", className)} {...props} />;
  },
);

export const CardContent = forwardRef<HTMLDivElement, CardProps>(function CardContent(
  { className, asChild = false, ...props },
  ref,
) {
  const Tag: ElementType = asChild ? Slot : "div";
  return <Tag ref={ref} className={cn("p-6 pt-0", className)} {...props} />;
});

export const CardFooter = forwardRef<HTMLDivElement, CardProps>(function CardFooter(
  { className, asChild = false, ...props },
  ref,
) {
  const Tag: ElementType = asChild ? Slot : "div";
  return <Tag ref={ref} className={cn("flex items-center gap-3 p-6 pt-0", className)} {...props} />;
});
