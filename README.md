# Twitter Webhook

x.com (Twitter) のツイート一覧でブックマークボタンの隣に送信ボタンを注入し、クリックするとそのツイートの URL と投稿時刻を、popup で登録した有効な Discord webhook 全てへ転送する Chrome 拡張 (Manifest V3) です。

## セットアップ

```bash
pnpm install
```

`pnpm install` の `prepare` スクリプトで husky の git hooks・WXT の型生成・Panda CSS のコード生成が走ります。

## 開発

| コマンド            | 内容                                                                       |
| ------------------- | -------------------------------------------------------------------------- |
| `pnpm dev`          | Chrome を起動し拡張を読み込んだ状態で開発 (WXT dev サーバ + HMR)           |
| `pnpm build`        | 本番ビルドを `.output/chrome-mv3/` に出力                                  |
| `pnpm zip`          | Chrome Web Store 提出用に `.output/` を zip 化                             |
| `pnpm lint`         | oxlint + oxfmt --check                                                     |
| `pnpm fmt`          | oxlint --fix + oxfmt (フォーマット適用)                                    |
| `pnpm typecheck`    | `@typescript/native-preview` (tsgo) による型チェック                       |
| `pnpm test`         | vitest (unit; node 環境)                                                   |
| `pnpm test:browser` | vitest browser mode (Playwright provider; コンポーネント/DOM 抽出のテスト) |

実装をする前にライブラリの挙動を確認する場合は context7 や Web 検索で調査してから進めてください。

### テスト構成

- **unit** (`pnpm test`): `shared/**/*.test.ts` の pure function / RPC route テスト。`vitest.config.ts` は `**/*.browser.test.*` を除外
- **browser** (`pnpm test:browser`): `vitest.browser.config.ts`(Playwright provider)で popup コンポーネントの振る舞いテストと、x.com の DOM fixture を組み立てて検証する `shared/tweet/extract.browser.test.ts` を実行

## 使い方

1. 拡張アイコンをクリックして popup を開く
2. 「ADD WEBHOOK」フォームに名前と Discord webhook URL (`https://discord.com/api/webhooks/...`) を入力して追加
3. リストの各行でトグルボタンにより有効/無効を切り替え、ゴミ箱ボタン+確認ダイアログで削除できる
4. x.com のツイート一覧を開くと、各ツイートのブックマークボタンの隣に送信ボタンが表示される
5. 送信ボタンを押すと、そのツイートの URL と投稿時刻 (`<t:unix:f>` 形式) が、有効な webhook 全てに Discord メッセージとして送信される。ボタンは送信中→成功/エラーの状態を短時間表示し、詳細はブラウザの console に出力される

## アーキテクチャ

popup / content script は `runtime.sendMessage` 経由で background service worker 上の Hono app に RPC を投げる構成です(`hc<AppType>` + custom fetch でトンネルする実装は `.claude/skills/hono-rpc-runtime-messaging/SKILL.md` を参照)。popup の UI・トークンは `.claude/skills/cannelloni-design-system/SKILL.md` の Cannelloni デザインシステムに従っています。

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

データモデル・RPC routes・payload 形式・エラーハンドリングの詳細な設計は以下を参照してください。

- 設計仕様: `docs/superpowers/specs/2026-08-20-twitter-webhook-extension-design.md`
- RPC 実装パターン: `.claude/skills/hono-rpc-runtime-messaging/SKILL.md`
- デザインシステム: `.claude/skills/cannelloni-design-system/SKILL.md`

## 動作確認

自動テスト (`pnpm test` / `pnpm test:browser`) で pure function・RPC route・popup コンポーネントはカバーしていますが、実ブラウザでの拡張読み込みと x.com 上の挙動は手動で確認してください。

### 準備

1. `pnpm build` で `.output/chrome-mv3/` を生成する(または `pnpm dev` で HMR 付きの開発ビルドを起動する)
2. Chrome で `chrome://extensions` を開き、デベロッパーモードを ON にする
3. 「パッケージ化されていない拡張機能を読み込む」で `.output/chrome-mv3` を選択する

### チェックリスト

- [ ] **webhook 登録**: popup を開き、Discord webhook URL を1件登録する。リストに表示され、初期状態で有効 (enabled) になっていることを確認する
- [ ] **cold SW 起動確認**: 拡張をリロード(service worker を停止させる)した直後、**popup を開かずに** x.com を開いてツイートの送信ボタンを押す。background service worker がモジュールスコープに状態を持たず `browser.storage.local` から読み直せていれば、popup を経由しなくても正常に送信できる
- [ ] **per-row トグル**: popup でリストの行のトグルボタンを押し、無効にした webhook が x.com からの送信で使われない(有効な webhook にのみ届く)ことを確認する
- [ ] **per-row 削除**: 削除ボタン→確認ダイアログ→確定の流れで1件削除し、リストから消えることを確認する
- [ ] **Discord が非 2xx を返す**(例: webhook URL を無効な ID に書き換える): 送信ボタンが error 状態になり、console に失敗した webhook 名とステータスが出力されることを確認する
- [ ] **有効な webhook が 0 件**: 全ての webhook を無効化またはリストを空にした状態で送信ボタンを押し、error 状態になり console に「送信先なし」である旨が出力されることを確認する
- [ ] **ツイート情報抽出の失敗**: 抽出できない DOM 構造(例: 想定外のページ)でボタンを押した場合、error 状態になり console にエラーが出力され、どの webhook にも送信されないことを確認する
