import { Heading } from "react-aria-components";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

import * as styles from "./styles.css";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
};

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmDialogProps) => {
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={handleOpenChange} className={styles.root}>
      <div className={styles.titleRoot}>
        <Heading slot="title" className={styles.title}>
          {title}
        </Heading>
      </div>
      <p slot="description" className={styles.message}>
        {message}
      </p>
      <div className={styles.actions}>
        <Button variant="outline" onPress={onClose}>
          CANCEL
        </Button>
        <Button variant="danger" onPress={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
};
