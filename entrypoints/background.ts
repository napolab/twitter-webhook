import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import { handleRPC } from "@/shared/rpc/serialize";
import { isRPCMessage } from "@/shared/rpc/messages";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isRPCMessage(message)) return undefined;
    if (sender.id !== browser.runtime.id) return undefined;

    // sanctioned exception: onMessage listener must stay sync (see skill hono-rpc-runtime-messaging)
    handleRPC(message.request).then(sendResponse, (error: unknown) => {
      sendResponse({
        status: 500,
        headers: [["content-type", "application/json"]],
        body: JSON.stringify({ error: `${error}` }),
      });
    });
    return true;
  });
});
