import { useCallback, useEffect, useState } from "react";

import { AddWebhookForm } from "@/components/add-webhook-form";
import { WebhookList } from "@/components/webhook-list";
import { rpc } from "@/shared/rpc/client";

import * as styles from "./styles.css";

import type { Webhook, WebhookInput } from "@/shared/webhooks/schema";

export const App = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await rpc.rpc.webhooks.$get();
      if (!res.ok) return;
      setWebhooks(await res.json());
    };
    void load();
  }, []);

  const handleAdd = useCallback(async (input: WebhookInput) => {
    try {
      const res = await rpc.rpc.webhooks.$post({ json: input });
      if (!res.ok) return;
      const created = await res.json();
      setWebhooks((prev) => [...prev, created]);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleToggle = useCallback(async (id: string, enabled: boolean) => {
    try {
      const res = await rpc.rpc.webhooks[":id"].$patch({ param: { id }, json: { enabled } });
      if (!res.ok) return;
      const updated = await res.json();
      setWebhooks((prev) => prev.map((webhook) => (webhook.id === id ? updated : webhook)));
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await rpc.rpc.webhooks[":id"].$delete({ param: { id } });
      if (!res.ok) return;
      setWebhooks((prev) => prev.filter((webhook) => webhook.id !== id));
    } catch (error) {
      console.error(error);
    }
  }, []);

  return (
    <main className={styles.root}>
      <h1 className={styles.title}>TWITTER WEBHOOK</h1>
      <section aria-label="登録済み webhook">
        <h2 className={styles.srOnly}>登録済み webhook</h2>
        <WebhookList webhooks={webhooks} onToggle={handleToggle} onDelete={handleDelete} />
      </section>
      <section aria-label="webhook 追加">
        <h2 className={styles.sectionLabel}>ADD WEBHOOK</h2>
        <AddWebhookForm onSubmit={handleAdd} />
      </section>
    </main>
  );
};
