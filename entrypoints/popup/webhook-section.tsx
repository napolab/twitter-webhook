import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { AddWebhookForm } from "@/components/add-webhook-form";
import { WebhookList } from "@/components/webhook-list";

import { createWebhookAtom, deleteWebhookAtom, toggleWebhookAtom, webhooksAtom } from "./atoms";
import * as styles from "./styles.css";

import type { WebhookInput } from "@/shared/webhooks/schema";

export const WebhookSection = () => {
  const webhooks = useAtomValue(webhooksAtom);
  const createWebhook = useSetAtom(createWebhookAtom);
  const toggleWebhook = useSetAtom(toggleWebhookAtom);
  const deleteWebhook = useSetAtom(deleteWebhookAtom);

  // AddWebhookForm awaits onSubmit and only clears its fields on success, so failures
  // must propagate rather than be swallowed here.
  const handleAdd = useCallback(
    async (input: WebhookInput) => {
      await createWebhook(input);
    },
    [createWebhook],
  );

  // onToggle/onDelete are invoked fire-and-forget by WebhookRow (sync prop signature), so
  // failures must be caught here to avoid an unhandled promise rejection.
  const handleToggle = useCallback(
    async (id: string, enabled: boolean) => {
      try {
        await toggleWebhook({ id, enabled });
      } catch (error) {
        console.error(error);
      }
    },
    [toggleWebhook],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteWebhook(id);
      } catch (error) {
        console.error(error);
      }
    },
    [deleteWebhook],
  );

  return (
    <>
      <section aria-label="登録済み webhook">
        <h2 className={styles.srOnly}>登録済み webhook</h2>
        <WebhookList webhooks={webhooks} onToggle={handleToggle} onDelete={handleDelete} />
      </section>
      <section aria-label="webhook 追加">
        <h2 className={styles.sectionLabel}>ADD WEBHOOK</h2>
        <AddWebhookForm onSubmit={handleAdd} />
      </section>
    </>
  );
};
