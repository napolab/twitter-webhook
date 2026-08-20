import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { webhookInputSchema } from "@/shared/webhooks/schema";
import type { Webhook } from "@/shared/webhooks/schema";
import { readWebhooks, writeWebhooks } from "@/shared/webhooks/storage";

export const app = new Hono()
  .basePath("/rpc")
  .get("/webhooks", async (c) => {
    return c.json(await readWebhooks());
  })
  .post("/webhooks", zValidator("json", webhookInputSchema), async (c) => {
    const input = c.req.valid("json");
    const created: Webhook = { ...input, id: crypto.randomUUID(), type: "discord", enabled: true };
    const current = await readWebhooks();
    await writeWebhooks([...current, created]);
    return c.json(created, 201);
  })
  .patch("/webhooks/:id", zValidator("json", z.object({ enabled: z.boolean() })), async (c) => {
    const id = c.req.param("id");
    const { enabled } = c.req.valid("json");
    const current = await readWebhooks();
    const target = current.find((w) => w.id === id);
    if (target === undefined) return c.json({ error: "not found" }, 404);
    const updated: Webhook = { ...target, enabled };
    await writeWebhooks(current.map((w) => (w.id === id ? updated : w)));
    return c.json(updated);
  })
  .delete("/webhooks/:id", async (c) => {
    const id = c.req.param("id");
    const current = await readWebhooks();
    await writeWebhooks(current.filter((w) => w.id !== id));
    return c.json({ ok: true });
  });

export type AppType = typeof app;
