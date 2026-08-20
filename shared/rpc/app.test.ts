import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { app } from "./app";
import { readWebhooks, writeWebhooks } from "@/shared/webhooks/storage";

describe("rpc app: webhooks CRUD", () => {
  beforeEach(() => fakeBrowser.reset());

  it("GET /rpc/webhooks returns []", async () => {
    const res = await app.request("/rpc/webhooks");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("POST creates webhook with id/type/enabled", async () => {
    const res = await app.request("/rpc/webhooks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "alerts", url: "https://discord.com/api/webhooks/1/x" }),
    });
    expect(res.status).toBe(201);
    const created = await res.json();
    expect(created).toMatchObject({ name: "alerts", type: "discord", enabled: true });
    expect(await readWebhooks()).toHaveLength(1);
  });

  it("POST rejects non-discord URL", async () => {
    const res = await app.request("/rpc/webhooks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "x", url: "https://example.com/hook" }),
    });
    expect(res.status).toBe(400);
  });

  it("PATCH toggles enabled / 404 on missing", async () => {
    await writeWebhooks([
      {
        id: "a",
        name: "n",
        url: "https://discord.com/api/webhooks/1/x",
        type: "discord",
        enabled: true,
      },
    ]);
    const res = await app.request("/rpc/webhooks/a", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enabled: false }),
    });
    expect((await res.json()).enabled).toBe(false);
    const missing = await app.request("/rpc/webhooks/zzz", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enabled: false }),
    });
    expect(missing.status).toBe(404);
  });

  it("DELETE removes webhook", async () => {
    await writeWebhooks([
      {
        id: "a",
        name: "n",
        url: "https://discord.com/api/webhooks/1/x",
        type: "discord",
        enabled: true,
      },
    ]);
    await app.request("/rpc/webhooks/a", { method: "DELETE" });
    expect(await readWebhooks()).toEqual([]);
  });
});
