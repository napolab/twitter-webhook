# Coding Rules

## Package Management

- Install modules: `pnpm add <package>`
- Uninstall modules: `pnpm remove <package>`

## TypeScript Configuration

- **DO NOT modify** `tsconfig.json` `paths` settings
- If path changes are needed, use `AskUserQuestion` to discuss first

## Development Scripts

| Command          | Description                                            |
| ---------------- | ------------------------------------------------------ |
| `pnpm dev`       | Launch Chrome with the extension loaded (WXT dev + HMR) |
| `pnpm build`     | Production build into `.output/chrome-mv3/`            |
| `pnpm zip`       | Package the build for Chrome Web Store submission      |
| `pnpm lint`      | Run oxlint                                             |
| `pnpm fmt`       | Format code (oxfmt + oxlint --fix)                     |
| `pnpm typecheck` | Type check with `@typescript/native-preview` (tsgo)    |

## After Implementation

**MUST run before completing any implementation task:**

```bash
pnpm lint && pnpm typecheck
```

- `pnpm lint`: Ensures code style and catches potential issues
- `pnpm typecheck`: Uses `tsgo` (TypeScript native compiler) for fast type checking

Do NOT use `npx tsc` or `pnpm tsc` directly. Always use `pnpm typecheck`.

## Promise Handling in Handlers

**FORBIDDEN**: `.then()` / `.catch()` / IIFE in event handlers

**REQUIRED**: Make `useCallback` async directly

```typescript
// Correct
const handleClick = useCallback(async () => {
  try {
    await asyncOperation();
  } catch (error) {
    console.error(error);
  }
}, []);

// Forbidden: .then/.catch
const handleClick = useCallback(() => {
  asyncOperation().then(setData).catch(setError);
}, []);

// Forbidden: IIFE
const handleClick = useCallback(() => {
  void (async () => {
    await asyncOperation();
  })();
}, []);
```

See: @.claude/rules/react.md#async-handler-rules-no-thencatch

## Tech Stack

- **Target**: Chrome Extension (Manifest V3)
- **Framework**: WXT (Vite ベース。`entrypoints/` 配下のファイル配置から manifest を自動生成)
- **UI**: React 19 + Panda CSS
- **Accessibility**: react-aria-components
- **Testing**: Vitest
- **Linting**: oxlint + oxfmt
- **Type Check**: @typescript/native-preview (tsgo)

### MV3 で意識すること

- **content script はページのオリジンで動く。** `indexedDB` / `localStorage` に触るとそれは
  対象サイト側のストレージであり、拡張のストレージではない。拡張の永続データは
  `browser.storage.*` を使う (WXT の `storage` API 経由)。
- **background は service worker で、いつでも停止する。** モジュールスコープの変数に状態を
  持たせない。状態は必ず `browser.storage.*` に置く。
- ページ側のグローバル (`window.*`) を content script から直接読むことはできない
  (isolated world)。必要なら `injectScript` でページコンテキストに注入する。
