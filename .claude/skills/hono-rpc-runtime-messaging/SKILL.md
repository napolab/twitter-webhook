---
name: hono-rpc-runtime-messaging
description: Use when popup, options, or content scripts need to call background service worker logic in this WXT MV3 extension — adding RPC routes, webhook CRUD, sending messages to background, wiring the hc client, or when considering hono/service-worker, fetch interception, or raw runtime.sendMessage.
---

# Hono RPC over runtime.sendMessage

## Overview

Background logic (storage CRUD, outbound `fetch` to webhook services) is exposed as a **Hono app running in-memory in the background service worker**, called from popup and content scripts through **`hc<AppType>` with a custom fetch that tunnels over `browser.runtime.sendMessage`**. One transport, identical client code in every context, end-to-end types from the route chain.

## Why not `hono/service-worker`

Chrome's SW `fetch` event intercepts requests from **extension pages only** (popup/options). Chrome docs state: _"Calls from content scripts are not intercepted by the service worker fetch handler."_ A content script on x.com can never reach a `handle(app)` fetch listener, and `web_accessible_resources` only exposes static files. Do not use fetch-event interception here — the message tunnel serves all contexts.
(Refs: developer.chrome.com/docs/extensions/develop/concepts/service-workers/events, hono.dev/docs/getting-started/service-worker)

## Architecture

```
popup ────┐  hc<AppType>('http://extension.internal', { fetch: messagingFetch })
content ──┤    Request → { url, method, headers, body } (JSON-serializable)
script    │    → browser.runtime.sendMessage
          ▼
background SW: onMessage (top-level, sync) → new Request(...) → app.fetch(request)
               → { status, headers, body: text } → sendResponse
```

- Routes own all side effects: `browser.storage.local` access and outbound `fetch` (webhook origins in `host_permissions`).
- Clients import **`type AppType` only** — background runtime code never enters UI bundles.

## Core pattern

```ts
// background: listener MUST be registered synchronously at top level of defineBackground
export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isRPCMessage(message)) return; // let other listeners handle it
    if (sender.id !== browser.runtime.id) return; // ignore other extensions

    handleRPC(message.request).then(sendResponse); // Hono: app.fetch(new Request(...))
    return true; // REQUIRED: keeps channel open
  });
});

// client (popup AND content script — identical):
const rpc = hc<AppType>("http://extension.internal", { fetch: messagingFetch });
```

`messagingFetch` builds a `Request`, extracts `{ url, method, headers: [...headers.entries()], body: await req.text() }` (body `undefined` for GET/HEAD), sends it, and rebuilds `new Response(res.body, { status, headers })`. Base URL is a dummy — Hono routes on pathname only.

## Hard rules

| Rule                                                                                                            | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`sendResponse` + `return true`, never return a Promise from the listener**                                    | WXT ≥0.20 removed webextension-polyfill; `browser` is `@wxt-dev/browser` (chrome-typed). Docs: "browser.runtime.onMessage no longer supports using promises to return a response." A returned Promise silently closes the channel → client hangs/undefined. This listener is the sanctioned exception to the repo's "no `.then` in handlers" rule (that rule targets React handlers): `handleRPC(...).then(sendResponse, ...)` here is correct — do NOT "fix" it by making the listener async. |
| Register `onMessage` synchronously at the top of `defineBackground`                                             | SW wakes per event; listeners added after `await` miss the waking message.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Define the Hono app as **one method chain** (`new Hono().get(...).post(...)`)                                   | Splitting into statements (`app.get(...)` separately) drops routes from `typeof app` → hc loses type safety.                                                                                                                                                                                                                                                                                                                                                                                   |
| Serialize Request/Response to plain JSON (`{url, method, headers, body:text}` / `{status, headers, body:text}`) | `runtime.sendMessage` is JSON-serializable only; Request/Response don't structured-clone. Binary → base64 later if ever needed.                                                                                                                                                                                                                                                                                                                                                                |
| No state in SW module scope; storage only                                                                       | Background SW is killed after ~30s idle. Route handlers read/write `browser.storage.local` every call.                                                                                                                                                                                                                                                                                                                                                                                         |
| Outbound webhook POSTs run in background with the origin in `host_permissions`                                  | Content-script fetch runs against the page origin → blocked by x.com CSP/CORS.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Return `undefined` (not `false`/`true`) for non-RPC messages                                                    | Returning `true` for messages you won't answer blocks other listeners' channels.                                                                                                                                                                                                                                                                                                                                                                                                               |

## Adding a route

Add to the chain in the shared app file with `zValidator` for input; the zod schema propagates to every `rpc.*.$post({ json })` call site. Client call: `const res = await rpc.rpc.webhooks.$get(); if (res.ok) data = await res.json();`

## Common mistakes

- Returning a Promise from the onMessage listener (works only under the removed polyfill / Firefox) → hangs on Chrome.
- Reaching for `hono/service-worker` `handle(app)` because "popup fetch works" → content script silently can't connect.
- Importing the app value (not `import type`) in popup/content → zod + storage code bundled into UI.
- Testing SW-lifetime bugs away: reload the extension and click the injected button _first_ (cold SW) to verify the sync-registration path.
