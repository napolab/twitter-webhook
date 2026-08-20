# Twitter Webhook Extension — Design Spec

Date: 2026-08-20
Status: approved direction (brainstorming complete)

## Purpose

Chrome 拡張 (Manifest V3)。x.com のツイートの bookmark ボタンの隣にボタンを注入し、クリックすると登録済みの複数 webhook (まず Discord) にツイートの URL と投稿時刻を転送する。

## Decided requirements

| 項目         | 決定                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| 転送する時刻 | ツイートの投稿時刻 (`<time datetime>` 由来)。時刻処理は dayjs                                              |
| 送信先       | 登録済みかつ enabled な全 webhook に一斉送信                                                               |
| 管理 UI      | 拡張の popup。webhook の追加 / 削除 / 有効・無効トグル                                                     |
| Discord 表示 | `content` に URL + `<t:unix:f>`(Discord ネイティブのタイムスタンプ記法)。URL は Discord 側で自動カード展開 |
| webhook 種別 | `type: "discord"` を持つ discriminated union の芽。今回実装は discord のみ                                 |

## Non-goals

- options page(popup で完結)
- Discord 以外の webhook 種別の実装(データモデルのみ将来対応)
- Firefox 対応、i18n、tweet 本文・画像の転送

## Tech stack

pnpm / WXT (MV3) / React 19 / Panda CSS / react-aria-components / Hono (+ zod, @hono/zod-validator) / dayjs / vitest (browser mode, Playwright provider) / oxlint + oxfmt / @typescript/native-preview (tsgo) / husky

## Architecture

RPC 層は **`.claude/skills/hono-rpc-runtime-messaging`** に従う(このスペックでは繰り返さない)。要点: Hono app を background SW でインメモリ実行し、popup / content script は `hc<AppType>` + custom fetch で `runtime.sendMessage` にトンネルする。

```
┌──────────────────────────┐      ┌───────────────────────┐
│ content script (x.com)   │      │ popup (React)         │
│  bookmark 隣にボタン注入    │      │  webhook 管理          │
└───────────┬──────────────┘      └──────────┬────────────┘
            │ rpc.rpc.send.$post              │ rpc.rpc.webhooks.*
            └───────── runtime.sendMessage ───┘
                            ▼
            ┌──────────────────────────────┐
            │ background SW (Hono app)     │
            │  CRUD → browser.storage.local │
            │  send → fetch(discord.com)    │
            └──────────────────────────────┘
```

## Data model

```ts
type Webhook = {
  id: string; // crypto.randomUUID()
  name: string; // 表示名 (min 1)
  url: string; // https://discord.com/api/webhooks/... (zod で検証)
  type: "discord";
  enabled: boolean; // 新規作成時 true
};
```

保存先: `browser.storage.local`、key `webhooks`、値 `Webhook[]`。読み出し時に zod で再検証し、不正なら `[]` にフォールバック。

## RPC routes (background Hono app)

単一メソッドチェーンで定義(型落ち防止)。入力は全て `zValidator("json", ...)`。

| Route                      | 役割                                                                       |
| -------------------------- | -------------------------------------------------------------------------- |
| `GET /rpc/webhooks`        | 一覧取得                                                                   |
| `POST /rpc/webhooks`       | 追加 `{ name, url }` → id/type/enabled を付与して 201                      |
| `PATCH /rpc/webhooks/:id`  | `{ enabled }` の切り替え(404 あり)                                         |
| `DELETE /rpc/webhooks/:id` | 削除                                                                       |
| `POST /rpc/send`           | `{ url, postedAt }` (postedAt = ISO 8601 datetime。`z.iso.datetime({ offset: true })` で検証、不正なら 400)。enabled な全 webhook へ fan-out |

`/rpc/send` の応答: `{ results: SendResult[] }`。`SendResult` は discriminated union:

```ts
type SendResult =
  | { id: string; name: string; outcome: "delivered"; status: number }
  | { id: string; name: string; outcome: "rejected"; status: number }
  | { id: string; name: string; outcome: "network_error" };
```

1件でも `outcome !== "delivered"` があればクライアント側は失敗として扱う(HTTP status は 200 のまま、results で判定)。

### Discord payload (pure function)

```ts
buildDiscordPayload({ url, postedAt }): { content: string }
// content = `${url}\n<t:${dayjs(postedAt).unix()}:f>`
```

manifest: `permissions: ["storage"]`, `host_permissions: ["https://discord.com/*"]`。

## Content script (x.com / twitter.com)

- `MutationObserver` でツイート `article` 内の action bar を監視し、**bookmark ボタンの隣**に送信ボタンを注入。注入済みマーカー(data 属性)で二重注入を防ぐ
- UI は WXT `createShadowRootUi` で Shadow DOM に隔離(x.com の CSS から遮断)
- ツイート情報抽出(pure function `extractTweetInfo(article)`):
  - URL: `article` 内の `<a href="…/status/…">` で `<time>` を包むもの → `https://x.com/{user}/status/{id}` に正規化
  - 投稿時刻: その `<time datetime>` の値
  - fallback: tweet 詳細ページの main tweet(time が link でない)は `location.href` + `<time datetime>`
- ボタン状態: `idle → sending(spinner) → success(チェックを一時表示) / error(danger 色)`。エラー詳細は console へ。数秒後 idle に戻る
- x.com はアイコンを SVG で描画しているため、ボタンも 16–24px の hand-rolled SVG(`currentColor`)で周囲に馴染ませる

## Popup UI

デザインは **`.claude/skills/cannelloni-design-system`** に従う(トークン・規約はそちらが正)。

レイアウト(ユーザー承認済みワイヤーフレーム): リスト + 下部インラインフォームの1画面完結。

```
┌─ TWITTER WEBHOOK ──────────────┐
│ ▸ alerts            [◼] [🗑]   │
│   discord.com/api/webhooks/…   │
│ ▸ log-channel       [◻] [🗑]   │
│                                │
│ ── ADD WEBHOOK ──────────────  │
│ NAME [________________]        │
│ URL  [________________]        │
│                    [ ADD ]     │
└────────────────────────────────┘
```

- リスト行: 名前 (mono/sm/semibold) + URL サブライン (fg.muted/2xs、省略表示) + RAC `ToggleButton`(24px 角、`data-selected` で accent 塗り)+ 削除ボタン (`danger.text`)
- 削除は `confirm-dialog` パターンで確認してから実行
- 追加フォーム: RAC `TextField`(Label + Input + FieldError)。URL は zod スキーマと同条件でクライアント検証
- 空状態: 「webhook が未登録」であることと popup での追加手順を 1〜2 行で示す
- semantic HTML: `main` / `section` + 見出し階層は `.claude/rules/semantic-html.md` 準拠

## Error handling

| 障害                     | 挙動                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Discord が非 2xx         | `results[].outcome = "rejected", status` を返す。ボタンは error 状態、console に詳細        |
| fetch が例外(network)  | `results[].outcome = "network_error"`(status なし)を返す                                   |
| enabled webhook が 0 件  | `/rpc/send` は `results: []` を返し、クライアントは error 扱い(送信先なしを console に明示) |
| postedAt が不正な形式    | `zValidator` が 400 を返す。Discord へは送信されない                                        |
| storage の値が壊れている | zod parse 失敗 → `[]` フォールバック                                                        |
| ツイート情報抽出失敗     | ボタンを error 状態にし console へ(webhook には送らない)                                    |

## Testing (TDD, vitest)

- pure functions: `buildDiscordPayload`(dayjs 変換含む)、`extractTweetInfo`(x.com の DOM fixture を browser mode で組み立て)
- RPC routes: `app.request()` で直接叩く。storage は `@webext-core/fake-browser`(`wxt/testing`)でモック、Discord fetch はスタブ
- popup components: vitest browser mode + Playwright provider で挙動テスト(追加・削除・トグル)
- content script の注入 loop(MutationObserver)は手動確認中心(fixture での抽出関数テストでロジックを担保)

## Workflow

小タスクに分割して subagent に実装を委譲。各タスク完了ごとに `pnpm lint && pnpm typecheck` を通し、difit を起動してユーザーに review 依頼。commit はユーザーの指示があるまで行わない。
