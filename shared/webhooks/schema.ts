import { z } from "zod";

export const webhookInputSchema = z.object({
  name: z.string().min(1),
  url: z.string().regex(/^https:\/\/discord\.com\/api\/webhooks\/.+/),
});

export const webhookSchema = webhookInputSchema.extend({
  id: z.string(),
  type: z.literal("discord"),
  enabled: z.boolean(),
});

export type Webhook = z.infer<typeof webhookSchema>;
export type WebhookInput = z.infer<typeof webhookInputSchema>;
