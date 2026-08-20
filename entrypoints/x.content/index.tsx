import { createRoot } from "react-dom/client";
import { defineContentScript } from "wxt/utils/define-content-script";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";
import { rpc } from "@/shared/rpc/client";
import { extractTweetInfo } from "@/shared/tweet/extract";
import { SendButton } from "./send-button";
import "@/assets/global.css";

const INJECTED_ATTR = "data-twitter-webhook-injected";
const ANCHOR_ID_ATTR = "data-twitter-webhook-anchor-id";

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
      const article = bookmark.closest("article");
      const anchor = bookmark.parentElement;
      if (!article || !anchor) return;

      // autoMount (below) requires the anchor to be a selector, not a resolved
      // Element — wxt's autoMountUi throws "autoMount and Element anchor
      // option cannot be combined" otherwise. Tag this tweet's anchor with a
      // unique id so we can hand autoMount a selector that resolves to this
      // exact element.
      const anchorId = crypto.randomUUID();
      anchor.setAttribute(ANCHOR_ID_ATTR, anchorId);

      const ui = await createShadowRootUi(ctx, {
        name: "twitter-webhook-button",
        position: "inline",
        anchor: `[${ANCHOR_ID_ATTR}="${anchorId}"]`,
        append: "after",
        onMount: (container) => {
          const root = createRoot(container);
          root.render(<SendButton onSend={() => sendTweet(article)} />);
          return root;
        },
        onRemove: (root) => root?.unmount(),
      });
      // x.com virtualizes the timeline, so anchors are detached continuously.
      // `ui.mount()` never gets torn down on removal — WXT only auto-removes
      // a UI on content-script invalidation (page navigation/extension
      // reload), not when its anchor leaves the DOM — so every injected
      // button's React root + shadow host would stay alive for the whole
      // session. `ui.autoMount()` watches the anchor selector via
      // `waitElement` and mounts/removes as it appears/disappears (see
      // `node_modules/wxt/dist/utils/content-script-ui/shared.mjs`,
      // `autoMountUi`), so scrolled-away buttons are actually unmounted.
      ui.autoMount();
    };

    const scan = async () => {
      const bookmarks = document.querySelectorAll(
        `button[data-testid="bookmark"]:not([${INJECTED_ATTR}]), button[data-testid="removeBookmark"]:not([${INJECTED_ATTR}])`,
      );
      // Mark every snapshotted bookmark synchronously, before any `await`
      // below. `mountNext` mutates the DOM (setting the anchor id attribute,
      // inserting the shadow host), which re-triggers this file's own
      // MutationObserver into a nested `scan()` call. If marking happened
      // inside `mountNext` (i.e. after an `await`), that nested scan could
      // still see an in-flight bookmark as unmarked and schedule a second
      // mount for it. Marking all of them up front, in one synchronous loop,
      // closes that window.
      for (const bookmark of bookmarks) {
        bookmark.setAttribute(INJECTED_ATTR, "");
      }
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
