import { beforeEach, describe, expect, it } from "vitest";
import { createStore } from "jotai";
import { fakeBrowser } from "wxt/testing/fake-browser";

import { handleRPC } from "@/shared/rpc/serialize";
import { isRPCMessage } from "@/shared/rpc/messages";
import {
  createWebhookAtom,
  deleteWebhookAtom,
  toggleWebhookAtom,
  webhooksAtom,
  WebhookRequestError,
} from "./atoms";

// Wires fakeBrowser.runtime.onMessage to the real handleRPC/hono app, mirroring the
// listener registered in entrypoints/background.ts. fake-browser's runtime.sendMessage
// resolves the returned promise once the listener's sendResponse callback is invoked and
// at least one listener returned `true` synchronously (chrome.runtime.onMessage semantics),
// so `handleRPC(...).then(sendResponse, ...)` inside a listener that returns `true` works
// the same way it does against the real background entrypoint.
const registerRPCListener = () => {
  fakeBrowser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isRPCMessage(message)) return undefined;

    handleRPC(message.request).then(sendResponse, (error: unknown) => {
      sendResponse({
        status: 500,
        headers: [["content-type", "application/json"]],
        body: JSON.stringify({ error: `${error}` }),
      });
    });
    return true;
  });
};

const input = { name: "alerts", url: "https://discord.com/api/webhooks/1/x" };

describe("popup atoms", () => {
  beforeEach(() => {
    fakeBrowser.reset();
    registerRPCListener();
  });

  it("resolves an empty list initially", async () => {
    const store = createStore();
    expect(await store.get(webhooksAtom)).toEqual([]);
  });

  it("creates a webhook and refreshes the read atom", async () => {
    const store = createStore();
    const created = await store.set(createWebhookAtom, input);

    expect(created).toMatchObject({ name: "alerts", type: "discord", enabled: true });
    expect(await store.get(webhooksAtom)).toEqual([created]);
  });

  it("toggles a webhook's enabled state", async () => {
    const store = createStore();
    const created = await store.set(createWebhookAtom, input);

    const updated = await store.set(toggleWebhookAtom, { id: created.id, enabled: false });

    expect(updated.enabled).toBe(false);
    const list = await store.get(webhooksAtom);
    expect(list).toEqual([updated]);
  });

  it("deletes a webhook", async () => {
    const store = createStore();
    const created = await store.set(createWebhookAtom, input);

    await store.set(deleteWebhookAtom, created.id);

    expect(await store.get(webhooksAtom)).toEqual([]);
  });

  it("rejects invalid create input with WebhookRequestError", async () => {
    const store = createStore();

    await expect(
      store.set(createWebhookAtom, { name: "", url: "not-a-discord-url" }),
    ).rejects.toBeInstanceOf(WebhookRequestError);
  });
});
