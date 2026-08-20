import { Dialog as AriaDialog, Modal, ModalOverlay } from "react-aria-components";

import { clsx } from "@/shared/utils/clsx";

import * as styles from "./styles.css";

import type { ReactNode } from "react";

type DialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isDismissable?: boolean;
  "aria-label"?: string;
  // Extra classes for the Modal so each consumer keeps its own sizing.
  className?: string;
  children: ReactNode;
};

export const Dialog = ({
  isOpen,
  onOpenChange,
  isDismissable = true,
  className,
  children,
  ...rest
}: DialogProps) => (
  <ModalOverlay
    isOpen={isOpen}
    isDismissable={isDismissable}
    onOpenChange={onOpenChange}
    className={styles.overlay}
  >
    <Modal className={clsx(styles.root, className)}>
      <AriaDialog aria-label={rest["aria-label"]}>{children}</AriaDialog>
    </Modal>
  </ModalOverlay>
);
