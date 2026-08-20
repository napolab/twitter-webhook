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
  <AriaTextField {...rest} className={clsx(styles.field, className)}>
    <Label className={styles.label}>{label}</Label>
    <div className={styles.inputRow}>
      <Input className={styles.input} placeholder={placeholder} autoComplete={autoComplete} />
    </div>
    <FieldError className={styles.error}>{errorMessage}</FieldError>
  </AriaTextField>
);
