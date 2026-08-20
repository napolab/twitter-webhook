import { hc } from "hono/client";
import { browser } from "wxt/browser";
import { serializeRequest } from "./serialize-request";
import { RPC_MESSAGE_TYPE, isSerializedResponse } from "./messages";
import type { RPCMessage } from "./messages";
import type { AppType } from "./app";

const messagingFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  const message: RPCMessage = { type: RPC_MESSAGE_TYPE, request: await serializeRequest(request) };
  const raw = await browser.runtime.sendMessage(message);
  if (!isSerializedResponse(raw)) throw new Error("malformed RPC response");
  const nullBody = raw.status === 204 || raw.status === 304;
  return new Response(nullBody ? null : raw.body, { status: raw.status, headers: raw.headers });
};

export const rpc = hc<AppType>("http://extension.internal", { fetch: messagingFetch });
