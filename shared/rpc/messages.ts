export const RPC_MESSAGE_TYPE = "hono-rpc" as const;

export type SerializedRequest = {
  url: string;
  method: string;
  headers: [string, string][];
  body: string | undefined;
};

export type SerializedResponse = {
  status: number;
  headers: [string, string][];
  body: string;
};

export type RPCMessage = { type: typeof RPC_MESSAGE_TYPE; request: SerializedRequest };

const isHeaderPairs = (value: unknown): value is [string, string][] => Array.isArray(value);

export const isSerializedRequest = (value: unknown): value is SerializedRequest => {
  if (typeof value !== "object" || value === null) return false;
  if (!("url" in value) || typeof value.url !== "string") return false;
  if (!("method" in value) || typeof value.method !== "string") return false;
  if (!("headers" in value) || !isHeaderPairs(value.headers)) return false;
  if (!("body" in value)) return false;
  return typeof value.body === "string" || value.body === undefined;
};

export const isSerializedResponse = (value: unknown): value is SerializedResponse => {
  if (typeof value !== "object" || value === null) return false;
  if (!("status" in value) || typeof value.status !== "number") return false;
  if (!("headers" in value) || !isHeaderPairs(value.headers)) return false;
  if (!("body" in value) || typeof value.body !== "string") return false;
  return true;
};

export const isRPCMessage = (message: unknown): message is RPCMessage => {
  if (typeof message !== "object" || message === null) return false;
  if (!("type" in message) || message.type !== RPC_MESSAGE_TYPE) return false;
  if (!("request" in message)) return false;
  return isSerializedRequest(message.request);
};
