// Table — shadcn/ui-style table primitives; semantic HTML under the classes.
// Exports: Table (wrapped in a horizontal-scroll container), TableHeader,
//   TableBody, TableFooter, TableRow, TableHead (th, scope="col" by default),
//   TableCell (td), TableCaption. Each forwards its ref and merges className
//   via cn(); all native attributes pass through.
// Usage:
//   <Table>
//     <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Price</TableHead></TableRow></TableHeader>
//     <TableBody><TableRow><TableCell>Pro</TableCell><TableCell>$12</TableCell></TableRow></TableBody>
//   </Table>
// Style rule: token classes only (border-line, text-muted, bg-surface-alt row
//   hover, rounded-control on the scroll frame).
// A11y: the scroll frame is keyboard-focusable and named (tabIndex 0,
//   role="region", aria-label from the table's aria-label or "Table"), since a
//   scrollable region nobody can focus fails WCAG scrollable-region-focusable
//   in Firefox (Minecraft Enchantment Calculator, 2026-10-06). Pass
//   aria-label on <Table> to name the region.

import { forwardRef, type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(function Table(
  { className, ...props },
  ref,
) {
  return (
    <div
      className="w-full overflow-x-auto rounded-control border border-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      tabIndex={0}
      role="region"
      aria-label={typeof props["aria-label"] === "string" && props["aria-label"] ? props["aria-label"] : "Table"}
    >
      <table ref={ref} className={cn("w-full caption-bottom border-collapse text-sm", className)} {...props} />
    </div>
  );
});

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  function TableHeader({ className, ...props }, ref) {
    return <thead ref={ref} className={cn("bg-surface-alt", className)} {...props} />;
  },
);

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  function TableBody({ className, ...props }, ref) {
    return <tbody ref={ref} className={className} {...props} />;
  },
);

export const TableFooter = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  function TableFooter({ className, ...props }, ref) {
    return (
      <tfoot ref={ref} className={cn("border-t border-line bg-surface-alt font-semibold", className)} {...props} />
    );
  },
);

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(function TableRow(
  { className, ...props },
  ref,
) {
  return (
    <tr
      ref={ref}
      className={cn("border-t border-line motion-safe:transition-colors hover:bg-surface-alt", className)}
      {...props}
    />
  );
});

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  function TableHead({ className, scope = "col", ...props }, ref) {
    return (
      <th
        ref={ref}
        scope={scope}
        className={cn("px-4 py-3 text-left align-middle font-semibold text-muted", className)}
        {...props}
      />
    );
  },
);

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  function TableCell({ className, ...props }, ref) {
    return <td ref={ref} className={cn("px-4 py-3 align-middle", className)} {...props} />;
  },
);

export const TableCaption = forwardRef<HTMLTableCaptionElement, HTMLAttributes<HTMLTableCaptionElement>>(
  function TableCaption({ className, ...props }, ref) {
    return <caption ref={ref} className={cn("mt-3 text-sm text-muted", className)} {...props} />;
  },
);
