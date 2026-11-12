// Component library barrel — import everything from "@/components/ui":
//   import { Button, Card, Input, Dialog } from "@/components/ui";
//
// `asChild` (Button, Badge and every Card slot) renders the component's single
// child element carrying the component's classes — the shadcn/Radix Slot
// contract — so a link that must look like a button is one element, not a
// <button> wrapped around an <a>:
//   <Button asChild size="lg"><Link href="/pricing">Pricing</Link></Button>
// (The template tsconfig maps "@/*" to the site root, so "@/components/ui"
// resolves here and "@/lib/cn" resolves to the cn() helper.)
//
// Token-class convention used across every component in this directory —
// Tailwind semantic utilities backed by the site's CSS custom properties:
//   colors : background, surface, surface-alt, foreground (--text), muted
//            (--text-muted), accent, accent-ink, on-accent, line,
//            accent-soft, accent-line, ok, warn, bad,
//            ok-ink, warn-ink, bad-ink, ok-soft, warn-soft, bad-soft,
//            ok-line, warn-line, bad-line
//            → bg-accent, text-muted, border-line, bg-warn-soft text-warn-ink ...
//   radius : rounded-control (--radius-control), rounded-panel (--radius)
//   motion : every transition/animation utility carries the motion-safe:
//            prefix so prefers-reduced-motion users get static UI
// Hard-coded hex/px colors are forbidden in generated pages; spacing uses
// Tailwind's built-in scale (px-4, ...) and headings the semantic type
// ladder (text-display, text-title, text-heading, text-lead).

export { cn } from "@/lib/cn";
export { Slot, type SlotProps } from "./slot";
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from "./button";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  type CardProps,
  type CardTitleProps,
  type CardDescriptionProps,
} from "./card";
export { Input, type InputProps } from "./input";
export { Select, type SelectProps } from "./select";
export { Textarea, type TextareaProps } from "./textarea";
export { Checkbox, type CheckboxProps } from "./checkbox";
export { Dialog, type DialogProps } from "./dialog";
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "./table";
export { Badge, type BadgeProps, type BadgeVariant } from "./badge";
export { Alert, type AlertProps, type AlertVariant } from "./alert";
export { Skeleton } from "./skeleton";
export { Accordion, type AccordionProps, type AccordionItem } from "./accordion";
export { Tabs, type TabsProps, type TabItem } from "./tabs";
export { Form, FormField, type FormFieldProps } from "./form";

export { RichText } from "./rich-text";
// One line on purpose: backfillUiKit appends missing barrel lines to older trees line by line.
export { Section, SectionHeader, SplitFeature, Steps, TrustPoints, FeatureGrid, Faq, type SectionProps, type SectionTone, type SectionHeaderProps, type SplitFeatureProps, type StepsProps, type TrustPointsProps, type FeatureGridProps, type FaqProps } from "./section";
export { ToolStage, ToolCard, ToolAnswer, Breakdown, type ToolStageProps, type ToolCardProps, type ToolAnswerProps, type BreakdownProps } from "./tool-stage";
export { SegmentedControl, ChipGroup, NumberField, Figures, type CraftOption, type ChoiceProps, type NumberFieldProps, type FiguresProps } from "./craft";
export { ArtMedia, ArtFloat, ArtWall, type ArtMediaProps, type ArtFloatProps, type ArtWallProps, type ArtTreatment, type ArtShape } from "./art-media";
