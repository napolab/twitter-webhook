import { enableShadowDOM } from "react-stately/private/flags/flags";
import { createRoot } from "react-dom/client";
import { defineContentScript } from "wxt/utils/define-content-script";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";
import { rpc } from "@/shared/rpc/client";
import { extractTweetInfo } from "@/shared/tweet/extract";
import { appToastQueue, ToastContainer } from "@/components/ui/toast";
import { SendButton } from "./send-button";
import * as styles from "./styles.css";
import "@/assets/global.css";
import type { SendResult } from "@/shared/rpc/app";

// react-aria's usePress verifies a press's release target with `nodeContains`
// (react-aria/dist/private/utils/shadowdom/DOMFunctions.mjs), which only walks
// into shadow roots when this experimental flag is on. Off (the default),
// a real trusted pointerup on our shadow-DOM button is retargeted by the
// browser to the shadow HOST at the document level, plain `node.contains()`
// fails the containment check against the button, and usePress cancels the
// press — onPress never fires. This is why a synthetic `.click()` "works"
// (it takes a different, AT-fallback path) while real user clicks silently
// do nothing. `react-stately/private/flags/flags` is not re-exported from
// react-stately's root; it's imported from this exact deep path by
// react-aria's own bundle too (verified in DOMFunctions.mjs), and
// `react-stately` was added as a direct (exact-pinned 3.49.0, matching what
// react-aria/react-aria-components already depend on) dependency so pnpm
// resolves both to the *same* store entry — required for the mutable flag
// set here to be visible to react-aria's own imported instance of this
// module, not a separate copy.
enableShadowDOM();

const INJECTED_ATTR = "data-twitter-webhook-injected";
const ANCHOR_ID_ATTR = "data-twitter-webhook-anchor-id";

const describeFailure = (result: Exclude<SendResult, { outcome: "delivered" }>): string => {
  switch (result.outcome) {
    case "rejected":
      return `${result.name} (status ${result.status})`;
    case "network_error":
      return `${result.name} (network error)`;
  }
};

const sendTweet = async (article: Element): Promise<void> => {
  const info = extractTweetInfo(article, location.href);
  if (!info) {
    console.warn("[twitter-webhook] tweet info extraction failed", article);
    throw new Error("tweet info extraction failed");
  }
  console.log("[twitter-webhook] sending", info);

  const res = await rpc.rpc.send.$post({ json: info });
  if (!res.ok) throw new Error(`rpc send failed: ${res.status}`);

  const { results } = await res.json();
  console.log("[twitter-webhook] send results", results);
  if (results.length === 0) throw new Error("no enabled webhooks (popup から追加してください)");

  const failed = results.filter(
    (r): r is Exclude<SendResult, { outcome: "delivered" }> => r.outcome !== "delivered",
  );
  if (failed.length > 0) {
    throw new Error(`failed: ${failed.map((f) => describeFailure(f)).join(", ")}`);
  }

  appToastQueue.add(
    { title: `webhook に送信しました (${results.length}件)`, variant: "success" },
    { timeout: 4000 },
  );
};

export default defineContentScript({
  matches: ["https://x.com/*", "https://twitter.com/*"],
  cssInjectionMode: "ui",
  main: async (ctx) => {
    // One page-level toast host, mounted once (not per tweet). Unlike the
    // per-tweet buttons, `document.body` never disappears, so a plain
    // `ui.mount()` is correct here — no autoMount/anchor-selector dance
    // needed. `createShadowRootUi` already registers `ctx.onInvalidated(remove)`
    // internally (see shadow-root.mjs), so no extra cleanup wiring is needed
    // either. `position: "inline"` is used deliberately instead of WXT's
    // `"overlay"` position type: overlay only gives the *shadow host* itself
    // `position: relative` and anchors the *content* to that host's own
    // document-flow location (see shared.mjs's `applyPosition`) — appended
    // to `document.body`, that's wherever `<body>`'s last child naturally
    // falls, which on x.com's long virtualized timeline is far below the
    // visible viewport. Instead, the region rendered *inside* the shadow
    // root (`components/ui/toast/styles.css.ts`'s `region` class) is given
    // `position: fixed` directly, which resolves against the real viewport
    // regardless of where the (0×0, non-participating) shadow host sits in
    // the page's flow.
    const toastUi = await createShadowRootUi(ctx, {
      name: "twitter-webhook-toast",
      position: "inline",
      anchor: document.body,
      append: "last",
      onMount: (container) => {
        const root = createRoot(container);
        root.render(<ToastContainer />);
        return root;
      },
      onRemove: (root) => root?.unmount(),
    });
    toastUi.mount();

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
        // Scoped to this UI only (not the shared entry CSS bundle, and not
        // the toast UI's own `createShadowRootUi` call below) — see
        // `styles.hostAlignment`'s comment in `./styles.css.ts` for why this
        // has to be a raw `:host` rule rather than a Panda class, and why it
        // lives here instead of leaking into every shadow root this entry
        // creates.
        css: styles.hostAlignment,
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
      //
      // `{ once: true }` is required: our anchor id is a fresh
      // `crypto.randomUUID()` per mount, so it can never reappear once
      // removed. Without `once`, `autoMountUi`'s `observeElement` loop
      // (shared.mjs's `while (!abortController.signal.aborted)`) would, after
      // the first unmount, re-enter `waitElement` watching for the anchor to
      // come back — forever, since it never will — leaving one permanently
      // running whole-document MutationObserver per scanned tweet. With
      // `once: true`, the `else` branch that runs on first disappearance
      // (`uiCallbacks.unmount(); if (options.once) uiCallbacks.stopAutoMount();`)
      // aborts the controller right after that single unmount, so the loop's
      // next `waitElement` call never happens.
      ui.autoMount({ once: true });
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
    ctx.onInvalidated(() => observer.disconnect());
    await scan();
  },
});
