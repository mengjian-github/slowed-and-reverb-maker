// Craft controls — the parts a tool page is touched through, built once with
// their states (hover, press, focus, selected, invalid) so a page never ships
// browser-default fields. They carry no colour of their own: everything is
// drawn from currentColor and four optional custom properties the page sets in
// its own CSS, so each site paints them in its concept's colours.
//   --craft-fill     selected / primary fill   (default: currentColor)
//   --craft-on-fill  text on that fill         (default: var(--background))
//   --craft-line     hairline and field border (default: currentColor at 25%)
//   --craft-well     field background          (default: currentColor at 6%)
// Exports: SegmentedControl, ChipGroup, NumberField, Figures.
// Usage (inside a "use client" tool component):
//   <SegmentedControl label="Mode" options={[{ value: "keep", label: "Feed what I keep" }, …]} value={mode} onValueChange={setMode} data-tool-input="mode" />
//   <ChipGroup label="Ratio" options={[{ value: "1:1:1", label: "1:1:1" }, …]} value={ratio} onValueChange={setRatio} data-tool-input="ratio" />
//   <NumberField id="keep" label="Starter you keep" unit="g" value={keep} onValueChange={setKeep} data-tool-input="keep_g" />
//   <Figures items={[{ label: "starter", value: "50", unit: "g" }, …]} />  // display-size, tabular, inherits the ground's ink
// Hooks (data-tool-input and any other data-* or aria-* attribute) go on the
// control itself, never on a wrapper around it: NumberField puts them on its
// <input>, SegmentedControl and ChipGroup on their radiogroup of native
// radios, which is where QA fills a sample. Each option's value is the value
// a sample picks. className goes on the control's outer element, for layout.
// The look lives in the platform stylesheet (.craft-*).

"use client";

import { useId, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CraftOption {
  value: string;
  label: ReactNode;
}

export interface ChoiceProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Accessible name of the group (rendered visibly unless hideLabel). */
  label: string;
  hideLabel?: boolean;
  options: CraftOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** Name the group's radios share; one is generated when omitted. */
  name?: string;
}

// The options are native radios inside their labels, so arrow keys, focus
// and form semantics come from the browser and QA selects an option by
// clicking the real control. Starter Feeding's first craft build had pressed
// buttons with role="radio" that no acceptance sample could select; its
// author hung data-tool-input on a wrapping <div> and every sample failed
// (ver_16f175aa-ab3, 2026-10-26).
// A segmented control holds two to four modes. Starter Feeding's calculator
// put five ratio presets in one 144px column and each 24px segment printed
// its label over the next (ver_f2e8283a-6b8, 2026-10-27): more options than
// four take the chip layout, which wraps.
function Choice({ kind, label, hideLabel, options, value, onValueChange, name, className, style, ...hooks }: ChoiceProps & { kind: "segmented" | "chips" }) {
  const generated = useId();
  const segmented = kind === "segmented" && options.length <= 4;
  return (
    <div className={cn("craft-choice", className)} style={style}>
      <span className={cn("craft-label", hideLabel && "sr-only")}>{label}</span>
      <div role="radiogroup" aria-label={label} {...hooks} className={segmented ? "craft-segmented" : "craft-chips"}>
        {options.map((option) => (
          <label key={option.value} className="craft-option">
            <input type="radio" name={name ?? generated} value={option.value} checked={option.value === value}
              onChange={() => onValueChange(option.value)} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/** Two to four mutually exclusive modes, one pressed segment. */
export function SegmentedControl(props: ChoiceProps) {
  return <Choice kind="segmented" {...props} />;
}

/** A short row of presets (ratios, sizes, amounts); one selected. */
export function ChipGroup(props: ChoiceProps) {
  return <Choice kind="chips" {...props} />;
}

export interface NumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  id: string;
  label: ReactNode;
  /** Shown inside the field after the number: "g", "kg", "%", "yrs". */
  unit?: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  /** One line under the field when the value cannot be used. */
  error?: ReactNode;
}

/** A large numeric field with its unit inside it. */
export function NumberField({ id, label, unit, value, onValueChange, error, className, ...props }: NumberFieldProps) {
  return (
    <div className={cn("craft-field", className)}>
      <label htmlFor={id} className="craft-label">{label}</label>
      <span className="craft-number" data-invalid={error ? "" : undefined}>
        <input id={id} name={id} type="text" inputMode="decimal" autoComplete="off" value={value}
          aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onValueChange(event.target.value)} {...props} />
        {unit ? <span className="craft-unit" aria-hidden="true">{unit}</span> : null}
      </span>
      {error ? <span id={`${id}-error`} className="craft-error" role="alert">{error}</span> : null}
    </div>
  );
}

export interface FiguresProps {
  /** The answer's parts at display size; value is already formatted. */
  items: { label: ReactNode; value: ReactNode; unit?: ReactNode }[];
  /** One quiet line under the figures: the total, the discard, the formula. */
  note?: ReactNode;
  className?: string;
}

/** The answer as figures: display-size tabular numerals in the ink of whatever ground holds them. */
export function Figures({ items, note, className }: FiguresProps) {
  return (
    <div className={cn("craft-figures", className)}>
      <dl style={{ ["--craft-count" as string]: items.length }}>
        {items.map((item, index) => (
          <div key={index}>
            <dd><output>{item.value}</output>{item.unit ? <span className="craft-unit">{item.unit}</span> : null}</dd>
            <dt>{item.label}</dt>
          </div>
        ))}
      </dl>
      {note ? <p className="craft-note">{note}</p> : null}
    </div>
  );
}
