// Form — lightweight form primitives (no form-state library).
// Exports: Form (a <form> forwardRef wrapper that never reloads the page:
//   without an action its native submit is prevented), FormField (label + control +
//   description + error with the association wired for you).
// FormField props: id (string, required — must equal the control's id),
//   label (string, required), description (optional hint rendered as
//   "{id}-description"), error (optional string rendered as "{id}-error" with
//   role="alert"), required (adds a visible marker), className via cn(),
//   children (exactly one control: Input, Textarea, Select, Checkbox...).
// Contract: put the same id on your control and set aria-invalid +
//   aria-describedby when error/description exist — FormField renders the
//   matching label/hint/error ids:
//     <FormField id="email" label="Email" error={errors.email}>
//       <Input id="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />
//     </FormField>
// Style rule: token classes only (text-muted hints, text-bad errors,
//   outline-accent focus rings live on the controls).

import { forwardRef, type FormHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Form = forwardRef<HTMLFormElement, FormHTMLAttributes<HTMLFormElement>>(function Form(
  { className, onSubmit, ...props },
  ref,
) {
  // A site's forms compute in the browser. With no action, a native submit
  // only reloads the page and wipes what the visitor typed, so it is
  // prevented before the author's onSubmit runs.
  return (
    <form
      ref={ref}
      className={cn("flex flex-col gap-5", className)}
      onSubmit={(event) => {
        if (props.action == null) event.preventDefault();
        onSubmit?.(event);
      }}
      {...props}
    />
  );
});

export interface FormFieldProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children?: ReactNode;
}

export function FormField({ id, label, description, error, required, className, children }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-bad">
            *
          </span>
        ) : null}
      </label>
      {children}
      {description ? (
        <p id={`${id}-description`} className="text-sm text-muted">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-semibold text-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}
