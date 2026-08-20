import type { SerializedRequest } from "./messages";

export const serializeRequest = async (request: Request): Promise<SerializedRequest> => {
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  return {
    url: request.url,
    method: request.method,
    headers: [...request.headers.entries()],
    body: hasBody ? await request.text() : null,
  };
};
