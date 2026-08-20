import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { app } from "./app";
import { writeWebhooks } from "@/shared/webhooks/storage";

const seed = async () =>
  writeWebhooks([
    {
      id: "a",
      name: "on",
      url: "https://discord.com/api/webhooks/1/x",
      type: "discord",
      enabled: true,
    },
    {
      id: "b",
      name: "off",
      url: "https://discord.com/api/webhooks/2/y",
      type: "discord",
      enabled: false,
    },
  ]);

const sendBody = JSON.stringify({
  url: "https://x.com/u/status/1",
  postedAt: "2026-08-20T03:00:00.000Z",
});

describe("POST /rpc/send", () => {
  beforeEach(() => fakeBrowser.reset());
  afterEach(() => vi.unstubAllGlobals());

  it("sends only to enabled webhooks with discord payload", async () => {
    await seed();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await app.request("/rpc/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: sendBody,
    });
    const { results } = await res.json();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://discord.com/api/webhooks/1/x");
    const body = JSON.parse(`${fetchMock.mock.calls[0]?.[1]?.body}`);
    expect(body.content).toContain("https://x.com/u/status/1");
    expect(results).toEqual([{ id: "a", name: "on", ok: true, status: 204 }]);
  });

  it("reports failures per webhook", async () => {
    await seed();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 429 })));
    const res = await app.request("/rpc/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: sendBody,
    });
    const { results } = await res.json();
    expect(results).toEqual([{ id: "a", name: "on", ok: false, status: 429 }]);
  });

  it("returns empty results when no enabled webhooks", async () => {
    const res = await app.request("/rpc/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: sendBody,
    });
    expect(await res.json()).toEqual({ results: [] });
  });
});
