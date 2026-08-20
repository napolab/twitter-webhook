# Twitter Webhook Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** x.com のツイートに送信ボタンを注入し、登録済み Discord webhook 全てへツイート URL と投稿時刻を転送する Chrome 拡張 (MV3) を新規構築する。

**Architecture:** Hono app を background service worker でインメモリ実行し、popup / content script は `hc<AppType>` + custom fetch で `runtime.sendMessage` にトンネルする(`.claude/skills/hono-rpc-runtime-messaging` 準拠)。UI は Cannelloni デザインシステム(`.claude/skills/cannelloni-design-system` 準拠)。

**Tech Stack:** pnpm / WXT (MV3) / React 19 / Panda CSS / react-aria-components / Hono + zod + @hono/zod-validator / dayjs / vitest (unit + browser mode) / oxlint + oxfmt / tsgo / husky

**Spec:** `docs/superpowers/specs/2026-08-20-twitter-webhook-extension-design.md`

## Global Constraints

- **絶対に git commit しない。** review 承認後にユーザーが指示したときのみ commit する(CLAUDE.md)。
- 各タスクの最後に必ず `pnpm lint && pnpm typecheck` を通し、テストがある場合は `pnpm test` / `pnpm test:browser` を通すこと。
- タスク完了ごとに difit(`pnpm dlx difit`)を起動してユーザーに review を依頼し、承認を待つ。
- RPC 層のコードを書く前に skill `hono-rpc-runtime-messaging` を、UI コードを書く前に skill `cannelloni-design-system` を必ず読むこと。
- コーディング規約(`.claude/rules/` 全て): top-level は arrow function のみ / `let`・`forEach`・`any`・non-null `!`・IIFE 禁止 / early return / barrel file 禁止 / `String()` でなくテンプレートリテラル / `parseInt(x, 10)` / acronym は `URL`・`ID` 表記 / UI の variant は data 属性 + 属性セレクタ、inline style 禁止。
- React handler: `useCallback` を直接 async にする。`.then`/`.catch`/IIFE 禁止。**唯一の例外**は background の `onMessage` listener(skill 参照 — async 化するとバグ)。
- `tsconfig.json` の `paths` を変更しない。WXT が生成する `@/` alias(srcDir root)をそのまま使う。
- content script の UI は Shadow DOM に隔離。永続データは `browser.storage.local` のみ。SW のモジュールスコープに状態を持たない。

## File Structure

```
twitter-webhook/
├── package.json / wxt.config.ts / tsconfig.json / panda.config.ts / postcss.config.cjs
├── vitest.config.ts            # unit (node + WxtVitest/fake-browser)
├── vitest.browser.config.ts    # browser mode (playwright/chromium)
├── .husky/pre-commit
├── assets/global.css           # panda base import
├── shared/
│   ├── webhooks/schema.ts      # zod schema + Webhook 型
│   ├── webhooks/storage.ts     # storage.local read/write
│   ├── discord/payload.ts      # buildDiscordPayload (dayjs)
│   ├── tweet/extract.ts        # extractTweetInfo
│   └── rpc/
│       ├── messages.ts         # wire 型 + type guard
│       ├── app.ts              # Hono app (routes)
│       └── client.ts           # hc + messagingFetch
├── components/
│   ├── ui/button/              # index.tsx + styles.css.ts (+ browser test)
│   ├── ui/text-field/
│   ├── ui/icons/
│   ├── ui/dialog/
│   ├── ui/confirm-dialog/
│   ├── webhook-row/
│   ├── webhook-list/
│   └── add-webhook-form/
└── entrypoints/
    ├── background.ts
    ├── popup/index.html / main.tsx / app.tsx / styles.css.ts
    └── x.content/index.tsx / send-button.tsx / styles.css.ts
```

---

### Task 1: プロジェクトスキャフォールド + ツールチェーン

**Files:**

- Create: `package.json`, `wxt.config.ts`, `tsconfig.json`, `.husky/pre-commit`, `.oxlintrc.json`
- Modify: `.gitignore`

**Interfaces:**

- Produces: `pnpm dev/build/lint/fmt/typecheck/test/test:browser` スクリプト。以降の全タスクが依存。

- [ ] **Step 1: WXT プロジェクト初期化**

```bash
pnpm dlx wxt@latest init . --template react --pm pnpm   # 既存ファイルと衝突したら手動マージ
pnpm add hono zod @hono/zod-validator dayjs react-aria-components
pnpm add -D @typescript/native-preview oxlint oxfmt husky vitest @vitest/browser playwright @pandacss/dev postcss
```

- [ ] **Step 2: package.json スクリプトを設定**

```jsonc
{
  "scripts": {
    "dev": "wxt",
    "build": "wxt build",
    "zip": "wxt zip",
    "lint": "oxlint . && oxfmt --check .",
    "fmt": "oxlint --fix . && oxfmt .",
    "typecheck": "tsgo --noEmit",
    "test": "vitest run",
    "test:browser": "vitest run --config vitest.browser.config.ts",
    "prepare": "husky && wxt prepare && panda codegen",
  },
}
```

- [ ] **Step 3: wxt.config.ts(auto-import 無効・manifest 権限)**

```ts
import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  imports: false, // 明示 import に統一 (oxlint フレンドリー)
  manifest: {
    name: "Twitter Webhook",
    permissions: ["storage"],
    host_permissions: ["https://discord.com/*"],
  },
});
```

- [ ] **Step 4: husky pre-commit**

```bash
echo "pnpm lint && pnpm typecheck" > .husky/pre-commit
```

- [ ] **Step 5: .gitignore に追記**: `.wxt/`, `.output/`, `styled-system/`, `node_modules/`

- [ ] **Step 6: 検証**: `pnpm build` が `.output/chrome-mv3/` を生成し、`pnpm lint && pnpm typecheck` が通ること(テンプレート由来コードは lint が通る最小構成まで削る。`entrypoints/` はデフォルトの popup + background だけ残す)

- [ ] **Step 7: difit を起動してユーザー review 依頼(commit はしない)**

---

### Task 2: Panda CSS + Cannelloni トークン移植

**Files:**

- Create: `panda.config.ts`, `postcss.config.cjs`, `assets/global.css`
- Modify: `entrypoints/popup/main.tsx`(global.css import)

**Interfaces:**

- Produces: `styled-system/css` の `css()`、semantic tokens(`bg.*`, `fg.*`, `border.*`, `accent.*`, `danger.*`)、`layerStyles.focusRing`。全 UI タスクが依存。

- [ ] **Step 1: skill `cannelloni-design-system` を読む**
- [ ] **Step 2: `/Users/napochaan/ghq/github.com/naporin0624/Cannelloni/panda.config.ts` を読み、ほぼそのまま移植**(tokens / semanticTokens / globalCss のフォント + marching-ants focus ring / layerStyles / keyframes / `colorScheme: 'dark'` を維持。`#root { position: fixed }` 等のアプリシェル規則と `include` パスは本リポジトリ構成に合わせる: `include: ["./components/**/*.{ts,tsx}", "./entrypoints/**/*.{ts,tsx}"]`)
- [ ] **Step 3: postcss.config.cjs**

```js
module.exports = { plugins: { "@pandacss/dev/postcss": {} } };
```

- [ ] **Step 4: assets/global.css**

```css
@layer reset, base, tokens, recipes, utilities;
```

- [ ] **Step 5: `panda codegen` 実行 → popup の main.tsx で `import "@/assets/global.css";` → `pnpm dev` で popup が暗色キャンバス(`bg.canvas`)になることを目視確認**
- [ ] **Step 6: `pnpm lint && pnpm typecheck` → difit review 依頼**

---

### Task 3: Webhook schema + storage 層(TDD)

**Files:**

- Create: `shared/webhooks/schema.ts`, `shared/webhooks/storage.ts`, `vitest.config.ts`
- Test: `shared/webhooks/storage.test.ts`

**Interfaces:**

- Produces:
  - `webhookSchema` (zod), `type Webhook = { id: string; name: string; url: string; type: "discord"; enabled: boolean }`
  - `webhookInputSchema` = `{ name: string; url: string }`(min 1 / discord webhook URL regex)
  - `readWebhooks(): Promise<Webhook[]>`, `writeWebhooks(webhooks: Webhook[]): Promise<void>`

- [ ] **Step 1: vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing";

export default defineConfig({
  plugins: [WxtVitest()],
  test: { include: ["shared/**/*.test.ts"] },
});
```

- [ ] **Step 2: schema.ts を書く(テスト対象の型が必要なため先行)**

```ts
import { z } from "zod";

export const webhookInputSchema = z.object({
  name: z.string().min(1),
  url: z.string().regex(/^https:\/\/discord\.com\/api\/webhooks\/.+/),
});

export const webhookSchema = webhookInputSchema.extend({
  id: z.string(),
  type: z.literal("discord"),
  enabled: z.boolean(),
});

export type Webhook = z.infer<typeof webhookSchema>;
export type WebhookInput = z.infer<typeof webhookInputSchema>;
```

- [ ] **Step 3: 失敗するテストを書く**

```ts
// shared/webhooks/storage.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing";
import { readWebhooks, writeWebhooks } from "./storage";
import type { Webhook } from "./schema";

const webhook: Webhook = {
  id: "a",
  name: "alerts",
  url: "https://discord.com/api/webhooks/1/x",
  type: "discord",
  enabled: true,
};

describe("storage", () => {
  beforeEach(() => fakeBrowser.reset());

  it("returns [] when empty", async () => {
    expect(await readWebhooks()).toEqual([]);
  });
  it("round-trips webhooks", async () => {
    await writeWebhooks([webhook]);
    expect(await readWebhooks()).toEqual([webhook]);
  });
  it("falls back to [] on corrupt data", async () => {
    await fakeBrowser.storage.local.set({ webhooks: { broken: true } });
    expect(await readWebhooks()).toEqual([]);
  });
});
```

- [ ] **Step 4: `pnpm test` → FAIL(storage.ts 未実装)を確認**
- [ ] **Step 5: storage.ts 実装**

```ts
import { browser } from "wxt/browser";
import { z } from "zod";
import { webhookSchema } from "./schema";
import type { Webhook } from "./schema";

const STORAGE_KEY = "webhooks";

export const readWebhooks = async (): Promise<Webhook[]> => {
  const stored = await browser.storage.local.get(STORAGE_KEY);
  const parsed = z.array(webhookSchema).safeParse(stored[STORAGE_KEY]);
  if (!parsed.success) return [];
  return parsed.data;
};

export const writeWebhooks = async (webhooks: Webhook[]): Promise<void> => {
  await browser.storage.local.set({ [STORAGE_KEY]: webhooks });
};
```

- [ ] **Step 6: `pnpm test` → PASS、`pnpm lint && pnpm typecheck` → difit review 依頼**

---

### Task 4: Discord payload builder(TDD)

**Files:**

- Create: `shared/discord/payload.ts`
- Test: `shared/discord/payload.test.ts`

**Interfaces:**

- Produces: `buildDiscordPayload(input: { url: string; postedAt: string }): { content: string }`

- [ ] **Step 1: 失敗するテスト**

```ts
import { describe, expect, it } from "vitest";
import { buildDiscordPayload } from "./payload";

describe("buildDiscordPayload", () => {
  it("builds content with URL and discord timestamp", () => {
    const result = buildDiscordPayload({
      url: "https://x.com/user/status/123",
      postedAt: "2026-08-20T03:00:00.000Z",
    });
    expect(result).toEqual({
      content: "https://x.com/user/status/123\n<t:1786935600:f>",
    });
  });
});
```

- [ ] **Step 2: `pnpm test` → FAIL 確認**(expected unix 値はテスト実行時に `dayjs("2026-08-20T03:00:00.000Z").unix()` で検算して固定)
- [ ] **Step 3: 実装**

```ts
import dayjs from "dayjs";

type BuildDiscordPayloadInput = { url: string; postedAt: string };

export const buildDiscordPayload = (input: BuildDiscordPayloadInput): { content: string } => {
  const unix = dayjs(input.postedAt).unix();
  return { content: `${input.url}\n<t:${unix}:f>` };
};
```

- [ ] **Step 4: `pnpm test` → PASS、lint/typecheck → difit review 依頼**

---

### Task 5: RPC wire format + Hono app(CRUD routes、TDD)

**Files:**

- Create: `shared/rpc/messages.ts`, `shared/rpc/app.ts`
- Test: `shared/rpc/app.test.ts`

**Interfaces:**

- Consumes: `readWebhooks` / `writeWebhooks` / `webhookInputSchema`(Task 3)
- Produces:
  - `messages.ts`: `RPC_MESSAGE_TYPE`, `SerializedRequest { url; method; headers: [string,string][]; body: string | undefined }`, `SerializedResponse { status; headers; body: string }`, `RPCMessage`, `isRPCMessage(m: unknown): m is RPCMessage`
  - `app.ts`: `app`(Hono、単一チェーン)、`type AppType`。routes: `GET/POST /rpc/webhooks`, `PATCH/DELETE /rpc/webhooks/:id`

- [ ] **Step 1: skill `hono-rpc-runtime-messaging` を読む**
- [ ] **Step 2: messages.ts(skill の Core pattern 節どおり)**

```ts
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
```

- [ ] **Step 3: 失敗するテスト(`app.request()` で直接叩く。storage は fakeBrowser)**

```ts
// shared/rpc/app.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing";
import { app } from "./app";
import { readWebhooks, writeWebhooks } from "@/shared/webhooks/storage";

describe("rpc app: webhooks CRUD", () => {
  beforeEach(() => fakeBrowser.reset());

  it("GET /rpc/webhooks returns []", async () => {
    const res = await app.request("/rpc/webhooks");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("POST creates webhook with id/type/enabled", async () => {
    const res = await app.request("/rpc/webhooks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "alerts", url: "https://discord.com/api/webhooks/1/x" }),
    });
    expect(res.status).toBe(201);
    const created = await res.json();
    expect(created).toMatchObject({ name: "alerts", type: "discord", enabled: true });
    expect(await readWebhooks()).toHaveLength(1);
  });

  it("POST rejects non-discord URL", async () => {
    const res = await app.request("/rpc/webhooks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "x", url: "https://example.com/hook" }),
    });
    expect(res.status).toBe(400);
  });

  it("PATCH toggles enabled / 404 on missing", async () => {
    await writeWebhooks([
      {
        id: "a",
        name: "n",
        url: "https://discord.com/api/webhooks/1/x",
        type: "discord",
        enabled: true,
      },
    ]);
    const res = await app.request("/rpc/webhooks/a", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enabled: false }),
    });
    expect((await res.json()).enabled).toBe(false);
    const missing = await app.request("/rpc/webhooks/zzz", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enabled: false }),
    });
    expect(missing.status).toBe(404);
  });

  it("DELETE removes webhook", async () => {
    await writeWebhooks([
      {
        id: "a",
        name: "n",
        url: "https://discord.com/api/webhooks/1/x",
        type: "discord",
        enabled: true,
      },
    ]);
    await app.request("/rpc/webhooks/a", { method: "DELETE" });
    expect(await readWebhooks()).toEqual([]);
  });
});
```

- [ ] **Step 4: `pnpm test` → FAIL 確認**
- [ ] **Step 5: app.ts 実装(単一メソッドチェーン厳守)**

```ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { webhookInputSchema } from "@/shared/webhooks/schema";
import type { Webhook } from "@/shared/webhooks/schema";
import { readWebhooks, writeWebhooks } from "@/shared/webhooks/storage";

export const app = new Hono()
  .basePath("/rpc")
  .get("/webhooks", async (c) => {
    return c.json(await readWebhooks());
  })
  .post("/webhooks", zValidator("json", webhookInputSchema), async (c) => {
    const input = c.req.valid("json");
    const created: Webhook = { ...input, id: crypto.randomUUID(), type: "discord", enabled: true };
    const current = await readWebhooks();
    await writeWebhooks([...current, created]);
    return c.json(created, 201);
  })
  .patch("/webhooks/:id", zValidator("json", z.object({ enabled: z.boolean() })), async (c) => {
    const id = c.req.param("id");
    const { enabled } = c.req.valid("json");
    const current = await readWebhooks();
    const target = current.find((w) => w.id === id);
    if (target === undefined) return c.json({ error: "not found" }, 404);
    const updated: Webhook = { ...target, enabled };
    await writeWebhooks(current.map((w) => (w.id === id ? updated : w)));
    return c.json(updated);
  })
  .delete("/webhooks/:id", async (c) => {
    const id = c.req.param("id");
    const current = await readWebhooks();
    await writeWebhooks(current.filter((w) => w.id !== id));
    return c.json({ ok: true });
  });

export type AppType = typeof app;
```

- [ ] **Step 6: `pnpm test` → PASS、lint/typecheck → difit review 依頼**

---

### Task 6: `/rpc/send` route — 全 enabled webhook へ fan-out(TDD)

**Files:**

- Modify: `shared/rpc/app.ts`(チェーンに `.post("/send", ...)` を追加)
- Test: `shared/rpc/send.test.ts`

**Interfaces:**

- Consumes: `buildDiscordPayload`(Task 4)、storage(Task 3)
- Produces: `POST /rpc/send` body `{ url: string; postedAt: string }` → `{ results: { id: string; name: string; ok: boolean; status?: number }[] }`(常に 200。失敗判定は results で行う)

- [ ] **Step 1: 失敗するテスト(global fetch を `vi.stubGlobal` でスタブ)**

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing";
import { app } from "./app";
import { writeWebhooks } from "@/shared/webhooks/storage";

const seed = async () =>
  writeWebhooks([
    {
      id: "a",
      name: "on",
      url: "https://discord.com/api/webhooks/1/x",
      type: "discord",
      enabled: true,
    },
    {
      id: "b",
      name: "off",
      url: "https://discord.com/api/webhooks/2/y",
      type: "discord",
      enabled: false,
    },
  ]);

const sendBody = JSON.stringify({
  url: "https://x.com/u/status/1",
  postedAt: "2026-08-20T03:00:00.000Z",
});

describe("POST /rpc/send", () => {
  beforeEach(() => fakeBrowser.reset());
  afterEach(() => vi.unstubAllGlobals());

  it("sends only to enabled webhooks with discord payload", async () => {
    await seed();
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await app.request("/rpc/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: sendBody,
    });
    const { results } = await res.json();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://discord.com/api/webhooks/1/x");
    const body = JSON.parse(`${fetchMock.mock.calls[0]?.[1]?.body}`);
    expect(body.content).toContain("https://x.com/u/status/1");
    expect(results).toEqual([{ id: "a", name: "on", ok: true, status: 204 }]);
  });

  it("reports failures per webhook", async () => {
    await seed();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 429 })));
    const res = await app.request("/rpc/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: sendBody,
    });
    const { results } = await res.json();
    expect(results).toEqual([{ id: "a", name: "on", ok: false, status: 429 }]);
  });

  it("returns empty results when no enabled webhooks", async () => {
    const res = await app.request("/rpc/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: sendBody,
    });
    expect(await res.json()).toEqual({ results: [] });
  });
});
```

- [ ] **Step 2: `pnpm test` → FAIL 確認**
- [ ] **Step 3: app.ts のチェーン末尾に追加**

```ts
  .post(
    "/send",
    zValidator("json", z.object({ url: z.string().url(), postedAt: z.string() })),
    async (c) => {
      const input = c.req.valid("json");
      const payload = buildDiscordPayload(input);
      const webhooks = await readWebhooks();
      const enabled = webhooks.filter((w) => w.enabled);
      const results = await Promise.all(
        enabled.map(async (w) => {
          const sendOne = async (): Promise<{ id: string; name: string; ok: boolean; status?: number }> => {
            try {
              const res = await fetch(w.url, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
              });
              return { id: w.id, name: w.name, ok: res.ok, status: res.status };
            } catch {
              return { id: w.id, name: w.name, ok: false };
            }
          };
          return sendOne();
        }),
      );
      return c.json({ results });
    },
  );
```

(zod v4 を使う場合 `z.string().url()` が非推奨なら `z.url()` に置き換える — インストールされた zod の README/型定義に従うこと)

- [ ] **Step 4: `pnpm test` → PASS、lint/typecheck → difit review 依頼**

---

### Task 7: background エントリ + RPC クライアント

**Files:**

- Create: `shared/rpc/client.ts`
- Modify: `entrypoints/background.ts`
- Test: `shared/rpc/serialize.test.ts`(Request/Response 変換のラウンドトリップ)

**Interfaces:**

- Consumes: `app` / `AppType`(Task 5-6)、`messages.ts`(Task 5)
- Produces:
  - `shared/rpc/client.ts`: `export const rpc = hc<AppType>(...)` — popup / content script 共用
  - `shared/rpc/serialize.ts`: `serializeRequest(req: Request): Promise<SerializedRequest>`, `handleRPC(serialized: SerializedRequest): Promise<SerializedResponse>`

- [ ] **Step 1: skill `hono-rpc-runtime-messaging` を再読(hard rules 表)**
- [ ] **Step 2: 失敗するテスト**

```ts
// shared/rpc/serialize.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing";
import { handleRPC, serializeRequest } from "./serialize";

describe("rpc serialization round-trip", () => {
  beforeEach(() => fakeBrowser.reset());

  it("serializes GET without body", async () => {
    const s = await serializeRequest(new Request("http://extension.internal/rpc/webhooks"));
    expect(s).toEqual({
      url: "http://extension.internal/rpc/webhooks",
      method: "GET",
      headers: [],
      body: undefined,
    });
  });

  it("routes a serialized request through the hono app", async () => {
    const s = await serializeRequest(new Request("http://extension.internal/rpc/webhooks"));
    const res = await handleRPC(s);
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual([]);
  });
});
```

- [ ] **Step 3: `pnpm test` → FAIL 確認**
- [ ] **Step 4: serialize.ts 実装**

```ts
// shared/rpc/serialize.ts
import { app } from "./app";
import type { SerializedRequest, SerializedResponse } from "./messages";

export const serializeRequest = async (request: Request): Promise<SerializedRequest> => {
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  return {
    url: request.url,
    method: request.method,
    headers: [...request.headers.entries()],
    body: hasBody ? await request.text() : undefined,
  };
};

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
```

- [ ] **Step 5: background.ts(listener は同期登録・`sendResponse` + `return true`。Promise を返さない — skill の公認 `.then` 例外)**

```ts
import { defineBackground } from "wxt/utils/define-background";
import { browser } from "wxt/browser";
import { handleRPC } from "@/shared/rpc/serialize";
import { isRPCMessage } from "@/shared/rpc/messages";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isRPCMessage(message)) return;
    if (sender.id !== browser.runtime.id) return;

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
```

- [ ] **Step 6: client.ts**

```ts
import { hc } from "hono/client";
import { browser } from "wxt/browser";
import { RPC_MESSAGE_TYPE } from "./messages";
import type { RPCMessage, SerializedResponse } from "./messages";
import { serializeRequest } from "./serialize";
import type { AppType } from "./app";

const messagingFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  const message: RPCMessage = { type: RPC_MESSAGE_TYPE, request: await serializeRequest(request) };
  const res = (await browser.runtime.sendMessage(message)) as SerializedResponse;
  const nullBody = res.status === 204 || res.status === 304;
  return new Response(nullBody ? null : res.body, { status: res.status, headers: res.headers });
};

export const rpc = hc<AppType>("http://extension.internal", { fetch: messagingFetch });
```

> 注意: `serialize.ts` は `app.ts` を import するため、client からは `serializeRequest` だけが必要でも **client.ts に app の実行時コードが混入しないよう**、`serializeRequest` を `messages.ts` 側へ置くか `serialize-request.ts` に分離すること(実装時に bundle を確認して判断。`handleRPC` と同居させたまま client が import してはいけない)。

- [ ] **Step 7: `pnpm test` → PASS、`pnpm build` 成功、lint/typecheck → difit review 依頼**

---

### Task 8: UI プリミティブ移植(button / text-field / icons)

**Files:**

- Create: `components/ui/button/index.tsx` + `styles.css.ts`、`components/ui/text-field/index.tsx` + `styles.css.ts`、`components/ui/icons/index.tsx`
- Test: `components/ui/button/button.browser.test.tsx`、`vitest.browser.config.ts`

**Interfaces:**

- Produces:
  - `Button`(RAC Button ラップ、props: `variant?: "solid" | "outline" | "danger"`, `size?: "md" | "icon"` → `data-variant`/`data-size`)
  - `TextField`(RAC TextField+Label+Input+FieldError ラップ、props: `label: string`, `errorMessage?: string`, ほか RAC TextFieldProps)
  - `TrashIcon` / `CheckIcon` / `SendIcon` / `SpinnerIcon`(16px, `viewBox="0 0 24 24"`, `currentColor`, `aria-hidden`)

- [ ] **Step 1: skill `cannelloni-design-system` を読む**
- [ ] **Step 2: vitest.browser.config.ts**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": new URL(".", import.meta.url).pathname } },
  test: {
    include: ["**/*.browser.test.{ts,tsx}"],
    exclude: ["node_modules/**"],
    browser: {
      enabled: true,
      provider: "playwright",
      headless: true,
      instances: [{ browser: "chromium" }],
    },
  },
});
```

- [ ] **Step 3: 失敗する browser テスト(Button)**

```tsx
// components/ui/button/button.browser.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Button } from "./index";

describe("Button", () => {
  it("fires onPress and carries data-variant", async () => {
    const onPress = vi.fn();
    const screen = render(
      <Button variant="danger" onPress={onPress}>
        Delete
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Delete" });
    await expect.element(button).toHaveAttribute("data-variant", "danger");
    await button.click();
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

(`pnpm add -D vitest-browser-react` を忘れずに)

- [ ] **Step 4: `pnpm test:browser` → FAIL 確認**
- [ ] **Step 5: Cannelloni の `src/renderer/src/components/ui/button/`・`ui/text-field/`・`ui/icons/` を読み、本リポジトリ規約(namespace import、`root` 命名、data-attribute variants、`_focusVisible: { layerStyle: 'focusRing' }`、hover は `translate(3px, 3px)` + `stepSnap`)のまま移植。icons は `TrashIcon`/`CheckIcon`/`SendIcon`/`SpinnerIcon` のみ作成(SendIcon は紙飛行機型の hand-rolled SVG)**
- [ ] **Step 6: `pnpm test:browser` → PASS、lint/typecheck → difit review 依頼**

---

### Task 9: dialog / confirm-dialog 移植

**Files:**

- Create: `components/ui/dialog/index.tsx` + `styles.css.ts`、`components/ui/confirm-dialog/index.tsx` + `styles.css.ts`
- Test: `components/ui/confirm-dialog/confirm-dialog.browser.test.tsx`

**Interfaces:**

- Consumes: `Button`(Task 8)
- Produces: `ConfirmDialog`(props: `isOpen: boolean`, `title: string`, `message: string`, `confirmLabel: string`, `onConfirm: () => void`, `onClose: () => void`。RAC `ModalOverlay + Modal + Dialog + Heading slot="title"`。confirm ボタンは `variant="danger"`)

> Cannelloni の confirm-dialog は jotai グローバル駆動だが、本プロジェクトは jotai を導入しないため **props 駆動の制御コンポーネント**に簡略化する(YAGNI)。見た目・構造(flush stack, gap 0 の decision surface)は Cannelloni の `ui/dialog`・`ui/confirm-dialog` を踏襲。

- [ ] **Step 1: 失敗するテスト**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { ConfirmDialog } from "./index";

describe("ConfirmDialog", () => {
  it("calls onConfirm when confirm button pressed", async () => {
    const onConfirm = vi.fn();
    const screen = render(
      <ConfirmDialog
        isOpen
        title="DELETE WEBHOOK"
        message="alerts を削除します"
        confirmLabel="DELETE"
        onConfirm={onConfirm}
        onClose={() => {}}
      />,
    );
    await screen.getByRole("button", { name: "DELETE" }).click();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: FAIL 確認 → 実装 → PASS → lint/typecheck → difit review 依頼**

---

### Task 10: webhook-row + webhook-list(TDD)

**Files:**

- Create: `components/webhook-row/index.tsx` + `styles.css.ts`、`components/webhook-list/index.tsx` + `styles.css.ts`
- Test: `components/webhook-row/webhook-row.browser.test.tsx`

**Interfaces:**

- Consumes: `Webhook` 型(Task 3)、icons / Button(Task 8)、ConfirmDialog(Task 9)
- Produces:
  - `WebhookRow`(props: `webhook: Webhook`, `onToggle: (id: string, enabled: boolean) => void`, `onDelete: (id: string) => void`。削除は ConfirmDialog を内包して確認後に onDelete)
  - `WebhookList`(props: `webhooks: Webhook[]`, `onToggle`, `onDelete`。空配列時は空状態メッセージ)

- [ ] **Step 1: 失敗するテスト**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { WebhookRow } from "./index";
import type { Webhook } from "@/shared/webhooks/schema";

const webhook: Webhook = {
  id: "a",
  name: "alerts",
  url: "https://discord.com/api/webhooks/1/x",
  type: "discord",
  enabled: true,
};

describe("WebhookRow", () => {
  it("toggle calls onToggle with flipped enabled", async () => {
    const onToggle = vi.fn();
    const screen = render(<WebhookRow webhook={webhook} onToggle={onToggle} onDelete={() => {}} />);
    await screen.getByRole("button", { name: /有効/ }).click();
    expect(onToggle).toHaveBeenCalledWith("a", false);
  });

  it("delete requires confirmation", async () => {
    const onDelete = vi.fn();
    const screen = render(<WebhookRow webhook={webhook} onToggle={() => {}} onDelete={onDelete} />);
    await screen.getByRole("button", { name: /削除/ }).click();
    expect(onDelete).not.toHaveBeenCalled(); // dialog が開くだけ
    await screen.getByRole("button", { name: "DELETE" }).click();
    expect(onDelete).toHaveBeenCalledWith("a");
  });
});
```

- [ ] **Step 2: FAIL 確認**
- [ ] **Step 3: 実装。行の見た目は skill の token 表どおり: `minH: 'targetMin'`, `px: '2'`, `gap: '2'`, 1px `border.default`, 名前 mono/sm/semibold `fg.default`, URL サブライン `fg.muted`/`2xs` + `textOverflow: 'ellipsis'`。トグルは RAC `ToggleButton` 24px 角 (`isSelected={webhook.enabled}`, `aria-label="有効"`), `&[data-selected]` で accent 塗り。削除ボタンは `size="icon"` + `TrashIcon`, `color: 'danger.text'`, `aria-label="削除"`。`<article>` でなく `<li>`(リスト項目、`WebhookList` が `<ul role="list">` を持つ)**
- [ ] **Step 4: PASS → lint/typecheck → difit review 依頼**

---

### Task 11: add-webhook-form(TDD)

**Files:**

- Create: `components/add-webhook-form/index.tsx` + `styles.css.ts`
- Test: `components/add-webhook-form/add-webhook-form.browser.test.tsx`

**Interfaces:**

- Consumes: `webhookInputSchema` / `WebhookInput`(Task 3)、TextField / Button(Task 8)
- Produces: `AddWebhookForm`(props: `onSubmit: (input: WebhookInput) => Promise<void>`。zod でクライアント検証し、エラーは各 TextField の `errorMessage` に表示。成功時はフィールドをクリア)

- [ ] **Step 1: 失敗するテスト**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { AddWebhookForm } from "./index";

describe("AddWebhookForm", () => {
  it("submits valid input", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const screen = render(<AddWebhookForm onSubmit={onSubmit} />);
    await screen.getByLabelText("NAME").fill("alerts");
    await screen.getByLabelText("URL").fill("https://discord.com/api/webhooks/1/x");
    await screen.getByRole("button", { name: "ADD" }).click();
    expect(onSubmit).toHaveBeenCalledWith({
      name: "alerts",
      url: "https://discord.com/api/webhooks/1/x",
    });
  });

  it("shows error for non-discord URL and does not submit", async () => {
    const onSubmit = vi.fn();
    const screen = render(<AddWebhookForm onSubmit={onSubmit} />);
    await screen.getByLabelText("NAME").fill("x");
    await screen.getByLabelText("URL").fill("https://example.com");
    await screen.getByRole("button", { name: "ADD" }).click();
    expect(onSubmit).not.toHaveBeenCalled();
    await expect.element(screen.getByText(/discord/i)).toBeVisible();
  });
});
```

- [ ] **Step 2: FAIL 確認 → 実装(form stack は gap `element`、action 行は右寄せ gap `2`。submit handler は async useCallback 直書き)→ PASS → lint/typecheck → difit review 依頼**

---

### Task 12: popup 組み立て

**Files:**

- Modify: `entrypoints/popup/main.tsx`, `entrypoints/popup/app.tsx`(なければ Create)、`entrypoints/popup/styles.css.ts`, `entrypoints/popup/index.html`(`<title>Twitter Webhook</title>`)

**Interfaces:**

- Consumes: `rpc`(Task 7)、WebhookList(Task 10)、AddWebhookForm(Task 11)
- Produces: 動作する popup(一覧 / 追加 / トグル / 削除)

- [ ] **Step 1: app.tsx 実装**

```tsx
import { useCallback, useEffect, useState } from "react";
import { rpc } from "@/shared/rpc/client";
import type { Webhook, WebhookInput } from "@/shared/webhooks/schema";
import { WebhookList } from "@/components/webhook-list";
import { AddWebhookForm } from "@/components/add-webhook-form";
import * as styles from "./styles.css";

export const App = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await rpc.rpc.webhooks.$get();
      if (!res.ok) return;
      setWebhooks(await res.json());
    };
    void load();
  }, []);

  const handleAdd = useCallback(async (input: WebhookInput) => {
    try {
      const res = await rpc.rpc.webhooks.$post({ json: input });
      if (!res.ok) return;
      const created = await res.json();
      setWebhooks((prev) => [...prev, created]);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleToggle = useCallback(async (id: string, enabled: boolean) => {
    try {
      const res = await rpc.rpc.webhooks[":id"].$patch({ param: { id }, json: { enabled } });
      if (!res.ok) return;
      const updated = await res.json();
      setWebhooks((prev) => prev.map((w) => (w.id === id ? updated : w)));
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await rpc.rpc.webhooks[":id"].$delete({ param: { id } });
      if (!res.ok) return;
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch (error) {
      console.error(error);
    }
  }, []);

  return (
    <main className={styles.root}>
      <h1 className={styles.title}>TWITTER WEBHOOK</h1>
      <section aria-label="登録済み webhook">
        <h2 className={styles.srOnly}>登録済み webhook</h2>
        <WebhookList webhooks={webhooks} onToggle={handleToggle} onDelete={handleDelete} />
      </section>
      <section aria-label="webhook 追加">
        <h2 className={styles.sectionLabel}>ADD WEBHOOK</h2>
        <AddWebhookForm onSubmit={handleAdd} />
      </section>
    </main>
  );
};
```

- [ ] **Step 2: styles.css.ts(`root`: width 360px, `bg.canvas`, padding `page` 相当。`title`: mono/sm/wider tracking。`sectionLabel`: mono/xs/`fg.muted` + 上ボーダー区切り。`srOnly`: Panda の `srOnly` パターン)**
- [ ] **Step 3: `pnpm dev` で Chrome を起動し、popup で 追加 → トグル → 削除(確認ダイアログ)→ 再オープンで永続化 を手動確認(cold SW: 拡張リロード直後に popup を開いて一覧が出ること)**
- [ ] **Step 4: lint/typecheck → difit review 依頼**

---

### Task 13: extractTweetInfo(TDD, browser)

**Files:**

- Create: `shared/tweet/extract.ts`
- Test: `shared/tweet/extract.browser.test.ts`

**Interfaces:**

- Produces: `extractTweetInfo(article: Element, locationHref: string): { url: string; postedAt: string } | undefined`

- [ ] **Step 1: 失敗するテスト(x.com の DOM を模した fixture)**

```ts
import { describe, expect, it } from "vitest";
import { extractTweetInfo } from "./extract";

const timelineArticle = () => {
  const article = document.createElement("article");
  article.innerHTML = `
    <div><a href="/napolab/status/123"><time datetime="2026-08-20T03:00:00.000Z">8月20日</time></a></div>
    <div role="group"><button data-testid="bookmark"></button></div>`;
  return article;
};

const detailArticle = () => {
  const article = document.createElement("article");
  article.innerHTML = `
    <div><time datetime="2026-08-20T03:00:00.000Z">午後0:00 · 2026年8月20日</time></div>
    <div role="group"><button data-testid="bookmark"></button></div>`;
  return article;
};

describe("extractTweetInfo", () => {
  it("extracts from timeline article (time inside status link)", () => {
    expect(extractTweetInfo(timelineArticle(), "https://x.com/home")).toEqual({
      url: "https://x.com/napolab/status/123",
      postedAt: "2026-08-20T03:00:00.000Z",
    });
  });

  it("falls back to location for detail page main tweet", () => {
    expect(extractTweetInfo(detailArticle(), "https://x.com/napolab/status/123?s=20")).toEqual({
      url: "https://x.com/napolab/status/123",
      postedAt: "2026-08-20T03:00:00.000Z",
    });
  });

  it("returns undefined when no time element", () => {
    const article = document.createElement("article");
    expect(extractTweetInfo(article, "https://x.com/home")).toBeUndefined();
  });
});
```

- [ ] **Step 2: FAIL 確認**
- [ ] **Step 3: 実装**

```ts
type TweetInfo = { url: string; postedAt: string };

const extractFromLocation = (locationHref: string): string | undefined => {
  const matched = locationHref.match(/^https:\/\/(?:x|twitter)\.com\/[^/]+\/status\/\d+/);
  return matched?.[0];
};

export const extractTweetInfo = (article: Element, locationHref: string): TweetInfo | undefined => {
  const timeLink = article.querySelector('a[href*="/status/"]:has(time)');
  const time = timeLink?.querySelector("time") ?? article.querySelector("time");
  const postedAt = time?.getAttribute("datetime");
  if (!postedAt) return undefined;

  const href = timeLink?.getAttribute("href");
  if (href) return { url: new URL(href, "https://x.com").toString(), postedAt };

  const url = extractFromLocation(locationHref);
  if (!url) return undefined;
  return { url, postedAt };
};
```

- [ ] **Step 4: PASS → lint/typecheck → difit review 依頼**

---

### Task 14: content script — ボタン注入 + 送信

**Files:**

- Create: `entrypoints/x.content/index.tsx`, `entrypoints/x.content/send-button.tsx`, `entrypoints/x.content/styles.css.ts`

**Interfaces:**

- Consumes: `rpc`(Task 7)、`extractTweetInfo`(Task 13)、icons(Task 8)
- Produces: x.com 上で動く送信ボタン

- [ ] **Step 1: send-button.tsx(状態機械: idle → sending → success | error → 2.5s 後 idle。RAC Button + data-state 属性スタイリング)**

```tsx
import { useCallback, useState } from "react";
import { Button } from "react-aria-components";
import { CheckIcon, SendIcon, SpinnerIcon } from "@/components/ui/icons";
import * as styles from "./styles.css";

type SendState = "idle" | "sending" | "success" | "error";
type SendButtonProps = { onSend: () => Promise<void> };

const iconFor = (state: SendState) => {
  switch (state) {
    case "sending":
      return <SpinnerIcon />;
    case "success":
      return <CheckIcon />;
    case "idle":
    case "error":
      return <SendIcon />;
  }
};

export const SendButton = ({ onSend }: SendButtonProps) => {
  const [state, setState] = useState<SendState>("idle");

  const handlePress = useCallback(async () => {
    if (state === "sending") return;
    setState("sending");
    try {
      await onSend();
      setState("success");
    } catch (error) {
      console.error("[twitter-webhook] send failed:", error);
      setState("error");
    } finally {
      setTimeout(() => setState("idle"), 2500);
    }
  }, [onSend, state]);

  return (
    <Button
      className={styles.root}
      data-state={state}
      aria-label="webhook に送信"
      onPress={handlePress}
    >
      {iconFor(state)}
    </Button>
  );
};
```

- [ ] **Step 2: index.tsx — MutationObserver + createShadowRootUi**

```tsx
import { createRoot } from "react-dom/client";
import { defineContentScript } from "wxt/utils/define-content-script";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";
import { rpc } from "@/shared/rpc/client";
import { extractTweetInfo } from "@/shared/tweet/extract";
import { SendButton } from "./send-button";

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
```

- [ ] **Step 3: styles.css.ts — x.com の action bar に馴染むボタン(透明背景、`fg.muted` 相当の直接値は使わず token、hover で `accent.text`、`data-state="error"` で `danger.text`、`data-state="success"` で `accent.text`、SpinnerIcon は `animation: spin`)。ボタンは 34.75px(x.com の action アイコンと同径)に視覚合わせ、`aria-label` 必須**
- [ ] **Step 4: 手動検証(`pnpm dev`)**
  - タイムラインで各ツイートにボタンが1つだけ出る(スクロールで増殖しない)
  - **拡張リロード直後に popup を開かずボタンを押す**(cold SW 経路)→ Discord に URL + 時刻が届く
  - webhook 0 件 / disabled のみ → error 状態 + console に理由
  - tweet 詳細ページでも動く
- [ ] **Step 5: lint/typecheck → difit review 依頼**

---

### Task 15: 仕上げ — 全体検証 + README

**Files:**

- Create: `README.md`
- Modify: 検証で見つかった不具合の修正のみ

- [ ] **Step 1: 全テスト + build**: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:browser && pnpm build && pnpm zip`
- [ ] **Step 2: E2E 手動チェックリスト(spec の Error handling 表を1行ずつ)**
- [ ] **Step 3: README(セットアップ、`pnpm dev`、webhook 登録手順、アーキテクチャ図は spec へのリンク)**
- [ ] **Step 4: difit で最終 review 依頼。承認後、ユーザーの指示があれば commit**

### Task 16: popup を jotai + Suspense に refactor(ユーザー追加要件 2026-08-20)

skill `hono-electron-ipc:jotai-reactive-atoms` / `suspense-boundary-design` 準拠で、Task 12 の `useEffect` fetch を置き換える。

**Files:**
- Create: `entrypoints/popup/atoms.ts`, `entrypoints/popup/webhook-section.tsx`(list + form をまとめた async 境界内コンポーネント。ファイル配置は popup 配下の colocation でよい)
- Modify: `entrypoints/popup/App.tsx`(ErrorBoundary + Suspense 構成へ)、`package.json`(`pnpm add jotai react-error-boundary`)
- Test: `entrypoints/popup/atoms.test.ts`(unit)

**Interfaces:**
- Consumes: `rpc`(client)、`handleRPC`(テスト配線用)、既存 `WebhookList` / `AddWebhookForm`(props 変更なし)
- Produces:
  - `webhooksAtom = atomWithRefresh(async () => Webhook[])`(`rpc.rpc.webhooks.$get`; 非 2xx は throw)
  - write atoms: `createWebhookAtom(null, async (_get, set, input: WebhookInput) => Webhook)`, `toggleWebhookAtom(... { id, enabled })`, `deleteWebhookAtom(... id)` — 各々 `switch (res.status)` で分岐(`res.ok` 禁止)、成功時 `set(webhooksAtom)` で refresh、失敗は error class を throw(`modeling-errors-as-classes` 準拠の class、status を保持)
  - App 構成: `ErrorBoundary`(react-error-boundary、fallback にエラーメッセージ + 再試行ボタン → `useSetAtom(webhooksAtom)` で refresh)が **外側**、`Suspense`(fallback = 行サイズに合わせた skeleton、layout shift 防止)が内側、その中に `WebhookSection`(`useAtomValue(webhooksAtom)` + `useSetAtom(write atoms)`)

**Steps (TDD):**
1. `pnpm add jotai react-error-boundary`
2. 失敗するテスト `atoms.test.ts`: unit 環境で `fakeBrowser.runtime.onMessage` に `handleRPC` を配線した test-double listener を登録(fake-browser のサポートする応答スタイルでよい — 本物の Chrome semantics の検証ではなく atom ロジックの検証)し、jotai の `createStore()` で: 初期 read が `[]`、`createWebhookAtom` 後の read に作成分が現れる(refresh 検証)、`toggleWebhookAtom` / `deleteWebhookAtom` も同様、invalid input で error class が throw される
3. RED 確認 → `atoms.ts` 実装 → GREEN
4. `App.tsx` refactor: `useEffect`/`useState`/`useCallback` ハンドラ群を削除し、ErrorBoundary > Suspense > WebhookSection に。semantic-html 構造(main/h1/section/h2)は維持
5. 既知の許容挙動: mutation 後の refresh で async atom が再 suspend し skeleton が一瞬出る(atomWithRefresh の素直な挙動。unwrap による keep-previous 最適化はやらない — YAGNI、将来の改善余地としてノート)
6. `pnpm test && pnpm test:browser && pnpm lint && pnpm typecheck && pnpm build` → commit → difit review 依頼

## Self-Review Notes

- Spec coverage: 要件表・データモデル(T3)・RPC routes(T5/T6)・payload(T4)・content script(T13/T14)・popup UI(T8-T12)・error handling(T6/T14)・testing(各タスク)・workflow(Global Constraints)を確認済み。
- 型整合: `Webhook`/`WebhookInput`(T3)を T5/T10/T11/T12 で共用。`SerializedRequest/Response`(T5)を T7 で共用。`results` の形(T6)を T14 が消費。
- 既知の実装時判断ポイント: (1) zod v3/v4 の URL API 差(T6 に注記)、(2) `serializeRequest` の配置(T7 に注記 — client bundle に app が混入しない構成を実装時に確認)、(3) x.com の DOM 構造変化(T13 の fixture は 2026-08 時点の構造)。
