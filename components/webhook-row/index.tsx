import { useCallback, useState } from "react";
import { Button, ToggleButton } from "react-aria-components";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CheckIcon, TrashIcon } from "@/components/ui/icons";

import * as styles from "./styles.css";

import type { Webhook } from "@/shared/webhooks/schema";

type WebhookRowProps = {
  webhook: Webhook;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
};

export const WebhookRow = ({ webhook, onToggle, onDelete }: WebhookRowProps) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleToggleChange = useCallback(
    (isSelected: boolean) => {
      onToggle(webhook.id, isSelected);
    },
    [onToggle, webhook.id],
  );

  const handleDeletePress = useCallback(() => {
    setIsConfirmOpen(true);
  }, []);

  const handleConfirmClose = useCallback(() => {
    setIsConfirmOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    onDelete(webhook.id);
    setIsConfirmOpen(false);
  }, [onDelete, webhook.id]);

  return (
    <li className={styles.root}>
      <div className={styles.info}>
        <span className={styles.name}>{webhook.name}</span>
        <span className={styles.url}>{webhook.url}</span>
      </div>
      <ToggleButton
        className={styles.toggle}
        aria-label="有効"
        isSelected={webhook.enabled}
        onChange={handleToggleChange}
      >
        <CheckIcon />
      </ToggleButton>
      <Button className={styles.deleteButton} aria-label="削除" onPress={handleDeletePress}>
        <TrashIcon />
      </Button>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="DELETE WEBHOOK"
        message={`「${webhook.name}」を削除します。この操作は取り消せません。`}
        confirmLabel="DELETE"
        onConfirm={handleConfirm}
        onClose={handleConfirmClose}
      />
    </li>
  );
};
