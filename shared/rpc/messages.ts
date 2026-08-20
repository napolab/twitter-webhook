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

export const isRPCMessage = (message: unknown): message is RPCMessage => {
  if (typeof message !== "object" || message === null) return false;
  return "type" in message && message.type === RPC_MESSAGE_TYPE;
};
