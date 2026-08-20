import { app } from "./app";
import type { SerializedRequest, SerializedResponse } from "./messages";

export const handleRPC = async (serialized: SerializedRequest): Promise<SerializedResponse> => {
  const request = new Request(serialized.url, {
    method: serialized.method,
    headers: serialized.headers,
    body: serialized.body,
  });
  const response = await app.fetch(request);
  return {
    status: response.status,
    headers: [...response.headers.entries()],
    body: await response.text(),
  };
};
