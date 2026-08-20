import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { serializeRequest } from "./serialize-request";
import { handleRPC } from "./serialize";

describe("rpc serialization round-trip", () => {
  beforeEach(() => fakeBrowser.reset());

  it("serializes GET without body", async () => {
    const s = await serializeRequest(new Request("http://extension.internal/rpc/webhooks"));
    expect(s).toEqual({
      url: "http://extension.internal/rpc/webhooks",
      method: "GET",
      headers: [],
      body: undefined,
    });
  });

  it("serializes POST with body and headers", async () => {
    const s = await serializeRequest(
      new Request("http://extension.internal/rpc/webhooks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "alerts", url: "https://discord.com/api/webhooks/1/x" }),
      }),
    );
    expect(s.method).toBe("POST");
    expect(s.headers).toContainEqual(["content-type", "application/json"]);
    expect(s.body).toBe(
      JSON.stringify({ name: "alerts", url: "https://discord.com/api/webhooks/1/x" }),
    );
  });

  it("routes a serialized request through the hono app", async () => {
    const s = await serializeRequest(new Request("http://extension.internal/rpc/webhooks"));
    const res = await handleRPC(s);
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual([]);
  });

  it("round-trips a POST through the hono app", async () => {
    const s = await serializeRequest(
      new Request("http://extension.internal/rpc/webhooks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "alerts", url: "https://discord.com/api/webhooks/1/x" }),
      }),
    );
    const res = await handleRPC(s);
    expect(res.status).toBe(201);
    const created = JSON.parse(res.body);
    expect(created).toMatchObject({ name: "alerts", type: "discord", enabled: true });
  });
});
