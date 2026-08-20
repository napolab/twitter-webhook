import { useCallback } from "react";
import { useAtomValue } from "jotai";
import { useAtomCallback } from "jotai/utils";

import { AddWebhookForm } from "@/components/add-webhook-form";
import { WebhookList } from "@/components/webhook-list";

import { createWebhookAtom, deleteWebhookAtom, toggleWebhookAtom, webhooksAtom } from "./atoms";
import * as styles from "./styles.css";

import type { WebhookInput } from "@/shared/webhooks/schema";

export const WebhookSection = () => {
  const webhooks = useAtomValue(webhooksAtom);

  // AddWebhookForm awaits onSubmit and only clears its fields on success, so failures
  // must propagate rather than be swallowed here.
  const handleAdd = useAtomCallback(
    useCallback(async (_get, set, input: WebhookInput) => {
      await set(createWebhookAtom, input);
    }, []),
  );

  // onToggle/onDelete are invoked fire-and-forget by WebhookRow (sync prop signature), so
  // failures must be caught here to avoid an unhandled promise rejection.
  const handleToggle = useAtomCallback(
    useCallback(async (_get, set, id: string, enabled: boolean) => {
      try {
        await set(toggleWebhookAtom, { id, enabled });
      } catch (error) {
        console.error(error);
      }
    }, []),
  );

  const handleDelete = useAtomCallback(
    useCallback(async (_get, set, id: string) => {
      try {
        await set(deleteWebhookAtom, id);
      } catch (error) {
        console.error(error);
      }
    }, []),
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
