import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { readWebhooks, writeWebhooks } from "./storage";
import type { Webhook } from "./schema";

const webhook: Webhook = {
  id: "a",
  name: "alerts",
  url: "https://discord.com/api/webhooks/1/x",
  type: "discord",
  enabled: true,
};

describe("storage", () => {
  beforeEach(() => fakeBrowser.reset());

  it("returns [] when empty", async () => {
    expect(await readWebhooks()).toEqual([]);
  });
  it("round-trips webhooks", async () => {
    await writeWebhooks([webhook]);
    expect(await readWebhooks()).toEqual([webhook]);
  });
  it("falls back to [] on corrupt data", async () => {
    await fakeBrowser.storage.local.set({ webhooks: { broken: true } });
    expect(await readWebhooks()).toEqual([]);
  });
});
