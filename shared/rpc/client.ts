import { hc } from "hono/client";
import { browser } from "wxt/browser";
import { serializeRequest } from "./serialize-request";
import { RPC_MESSAGE_TYPE } from "./messages";
import type { RPCMessage, SerializedResponse } from "./messages";
import type { AppType } from "./app";

const messagingFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  const message: RPCMessage = { type: RPC_MESSAGE_TYPE, request: await serializeRequest(request) };
  const res = (await browser.runtime.sendMessage(message)) as SerializedResponse;
  const nullBody = res.status === 204 || res.status === 304;
  return new Response(nullBody ? null : res.body, { status: res.status, headers: res.headers });
};

export const rpc = hc<AppType>("http://extension.internal", { fetch: messagingFetch });
