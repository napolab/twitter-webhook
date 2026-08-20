import { Button as AriaButton } from "react-aria-components";

import { clsx } from "@/shared/utils/clsx";

import * as styles from "./styles.css";

import type { ButtonProps as AriaButtonProps } from "react-aria-components";

type Variant = "solid" | "outline" | "danger";
type Size = "md" | "icon";

type ButtonProps = Omit<AriaButtonProps, "className"> & {
  variant?: Variant;
  size?: Size;
  className?: string;
};

export const Button = ({ variant = "solid", size = "md", className, ...rest }: ButtonProps) => (
  <AriaButton
    {...rest}
    data-variant={variant}
    data-size={size}
    className={clsx(styles.root, className)}
  />
);
