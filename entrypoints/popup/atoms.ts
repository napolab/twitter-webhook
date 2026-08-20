import { atom } from "jotai";
import { atomWithRefresh } from "jotai/utils";

import { rpc } from "@/shared/rpc/client";

import type { Webhook, WebhookInput } from "@/shared/webhooks/schema";

export class WebhookRequestError extends Error {
  override name = "WebhookRequestError";

  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const webhooksAtom = atomWithRefresh(async (): Promise<Webhook[]> => {
  const res = await rpc.rpc.webhooks.$get();
  // Captured before the switch: once every literal status case is matched, TS narrows
  // `res.status` itself to `never` inside `default`, but this alias keeps a usable type.
  const status = res.status;
  switch (res.status) {
    case 200:
      return res.json();
    default:
      throw new WebhookRequestError(status, "failed to load webhooks");
  }
});

export const createWebhookAtom = atom(
  null,
  async (_get, set, input: WebhookInput): Promise<Webhook> => {
    const res = await rpc.rpc.webhooks.$post({ json: input });
    const status = res.status;
    switch (res.status) {
      case 201: {
        const created = await res.json();
        set(webhooksAtom);
        return created;
      }
      case 400:
        throw new WebhookRequestError(status, "invalid webhook input");
      default:
        throw new WebhookRequestError(status, "failed to create webhook");
    }
  },
);

type TogglePayload = { id: string; enabled: boolean };

export const toggleWebhookAtom = atom(
  null,
  async (_get, set, { id, enabled }: TogglePayload): Promise<Webhook> => {
    const res = await rpc.rpc.webhooks[":id"].$patch({ param: { id }, json: { enabled } });
    const status = res.status;
    switch (res.status) {
      case 200: {
        const updated = await res.json();
        set(webhooksAtom);
        return updated;
      }
      case 404:
        throw new WebhookRequestError(status, "webhook not found");
      default:
        throw new WebhookRequestError(status, "failed to update webhook");
    }
  },
);

export const deleteWebhookAtom = atom(null, async (_get, set, id: string): Promise<void> => {
  const res = await rpc.rpc.webhooks[":id"].$delete({ param: { id } });
  const status = res.status;
  switch (res.status) {
    case 200:
      set(webhooksAtom);
      return;
    default:
      throw new WebhookRequestError(status, "failed to delete webhook");
  }
});
