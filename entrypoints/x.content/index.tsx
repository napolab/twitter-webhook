import { createRoot } from "react-dom/client";
import { defineContentScript } from "wxt/utils/define-content-script";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";
import { rpc } from "@/shared/rpc/client";
import { extractTweetInfo } from "@/shared/tweet/extract";
import { SendButton } from "./send-button";
import "@/assets/global.css";

const INJECTED_ATTR = "data-twitter-webhook-injected";

const sendTweet = async (article: Element): Promise<void> => {
  const info = extractTweetInfo(article, location.href);
  if (!info) throw new Error("tweet info extraction failed");

  const res = await rpc.rpc.send.$post({ json: info });
  if (!res.ok) throw new Error(`rpc send failed: ${res.status}`);

  const { results } = await res.json();
  if (results.length === 0) throw new Error("no enabled webhooks (popup から追加してください)");

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) throw new Error(`failed: ${failed.map((f) => f.name).join(", ")}`);
};

export default defineContentScript({
  matches: ["https://x.com/*", "https://twitter.com/*"],
  cssInjectionMode: "ui",
  main: async (ctx) => {
    const mountNext = async (bookmark: Element) => {
      bookmark.setAttribute(INJECTED_ATTR, "");
      const article = bookmark.closest("article");
      const anchor = bookmark.parentElement;
      if (!article || !anchor) return;

      const ui = await createShadowRootUi(ctx, {
        name: "twitter-webhook-button",
        position: "inline",
        anchor,
        append: "after",
        onMount: (container) => {
          const root = createRoot(container);
          root.render(<SendButton onSend={() => sendTweet(article)} />);
          return root;
        },
        onRemove: (root) => root?.unmount(),
      });
      ui.mount();
    };

    const scan = async () => {
      const bookmarks = document.querySelectorAll(
        `button[data-testid="bookmark"]:not([${INJECTED_ATTR}]), button[data-testid="removeBookmark"]:not([${INJECTED_ATTR}])`,
      );
      for (const bookmark of bookmarks) {
        await mountNext(bookmark);
      }
    };

    const observer = new MutationObserver(() => {
      void scan();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    await scan();
  },
});
