import { browser } from "wxt/browser";
import { z } from "zod";
import { webhookSchema } from "./schema";
import type { Webhook } from "./schema";

const STORAGE_KEY = "webhooks";

export const readWebhooks = async (): Promise<Webhook[]> => {
  const stored = await browser.storage.local.get(STORAGE_KEY);
  const parsed = z.array(webhookSchema).safeParse(stored[STORAGE_KEY]);
  if (!parsed.success) return [];
  return parsed.data;
};

export const writeWebhooks = async (webhooks: Webhook[]): Promise<void> => {
  await browser.storage.local.set({ [STORAGE_KEY]: webhooks });
};
