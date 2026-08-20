import { WebhookRow } from "@/components/webhook-row";

import * as styles from "./styles.css";

import type { Webhook } from "@/shared/webhooks/schema";

type WebhookListProps = {
  webhooks: Webhook[];
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
};

export const WebhookList = ({ webhooks, onToggle, onDelete }: WebhookListProps) => {
  if (webhooks.length === 0) {
    return <p className={styles.empty}>Webhook は未登録です。下のフォームから追加できます。</p>;
  }

  return (
    <ul className={styles.root}>
      {webhooks.map((webhook) => (
        <WebhookRow key={webhook.id} webhook={webhook} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </ul>
  );
};
