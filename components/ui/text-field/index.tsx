import { FieldError, Input, Label, TextField as AriaTextField } from "react-aria-components";

import { clsx } from "@/shared/utils/clsx";

import * as styles from "./styles.css";

import type { TextFieldProps as AriaTextFieldProps } from "react-aria-components";

type TextFieldProps = Omit<AriaTextFieldProps, "className"> & {
  label: string;
  errorMessage?: string;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
};

export const TextField = ({
  label,
  errorMessage,
  placeholder,
  autoComplete,
  className,
  ...rest
}: TextFieldProps) => (
  // validationBehavior="aria" is the default here (overridable via rest) because this repo
  // never uses react-aria-components' <Form> — forms are plain <form> elements with
  // self-managed (zod) validation. RAC's default validationBehavior is "native" outside of
  // <Form>, which calls the underlying <input>.setCustomValidity(...) whenever isInvalid is
  // true. Once set, the browser's native constraint validation permanently blocks the
  // form's "submit" event — and therefore our onSubmit handler — from firing again until
  // setCustomValidity('') is called, which only happens inside that same blocked handler.
  // That is a deadlock: after one failed validation, the form could never submit again.
  // "aria" mode only sets aria-invalid and never touches native constraint validation.
  <AriaTextField validationBehavior="aria" {...rest} className={clsx(styles.field, className)}>
    <Label className={styles.label}>{label}</Label>
    <div className={styles.inputRow}>
      <Input className={styles.input} placeholder={placeholder} autoComplete={autoComplete} />
    </div>
    <FieldError className={styles.error}>{errorMessage}</FieldError>
  </AriaTextField>
);
