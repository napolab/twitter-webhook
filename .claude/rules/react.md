---
paths:
  - "src/**/*.tsx"
---

# React Conventions

## Client Boundary Rules

拡張の UI はすべてクライアントで動く (RSC はない)。代わりに意識するのは
**「どのエントリポイントで動く React か」** と **境界の粒度**。

| エントリポイント        | 実行コンテキスト             | 注意点                                        |
| ----------------------- | ---------------------------- | --------------------------------------------- |
| `entrypoints/popup/`    | 拡張オリジンの独立ページ     | 開くたびにマウントされる。状態は storage に置く |
| `entrypoints/*.content` | 対象サイトのページ内         | サイト側の CSS が混入する。Shadow DOM に隔離   |
| `entrypoints/background`| service worker (React なし)  | いつでも停止する。モジュール変数に状態を持たない |

非同期に失敗しうる部分は最小スコープで切り出し、必ず `ErrorBoundary` > `Suspense`
の順で包む (render エラーと Suspense エラーの両方を拾うため ErrorBoundary が外側)。

```tsx
// Correct — 失敗しうる範囲だけを切り出して包む
const Popup = () => (
  <>
    <Header />
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Suspense fallback={<CartListSkeleton />}>
        <CartList />   {/* storage 読み込みで suspend する */}
      </Suspense>
    </ErrorBoundary>
  </>
);

// Wrong — ルート全体を1つの境界で包む (どこで失敗しても全部消える)
const Popup = () => (
  <ErrorBoundary fallback={<ErrorMessage />}>
    <Suspense fallback={<Spinner />}>
      <Header />
      <CartList />
    </Suspense>
  </ErrorBoundary>
);
```

| Principle          | Rule                                                        |
| ------------------ | ----------------------------------------------------------- |
| 境界の粒度         | 失敗しうる/suspend する部分だけを切り出す                    |
| 境界の順序         | `ErrorBoundary` を外、`Suspense` を内                        |
| 永続データ         | `browser.storage.*` に置く。content script の localStorage 禁止 |
| content script の CSS | Shadow DOM に隔離し、サイト側スタイルの影響を受けない       |

## useEffect Restrictions (ULTRA STRICT)

### NEVER Use useEffect For:

- Data fetching
- State synchronization
- Derived state calculations
- Subscribing to external stores (use `useSyncExternalStore`)

### Absolutely Forbidden Pattern

```typescript
// FORBIDDEN: useEffect + useState for data fetching
const Component = ({ userId }: { userId: string }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser); // NEVER DO THIS
  }, [userId]);
};
```

### When useEffect IS Acceptable

Only for imperative DOM operations, with mandatory justification comment:

```typescript
useEffect(() => {
  // USEEFFECT_JUSTIFICATION: Required for imperative DOM focus
  // Cannot use Suspense as this is direct DOM manipulation
  inputRef.current?.focus();
}, []);
```

## Event Handler Rules (jsx-no-bind)

### Forbidden Pattern

```typescript
// Creates new function on every render
<button onClick={() => handleClick()}>Click</button>
<button onClick={() => onItemClick(item.id)}>Click</button>
```

### Correct Patterns

```typescript
// Use useCallback
const handleClick = useCallback(() => {
  // Handle click
}, []);

<button onClick={handleClick}>Click</button>
```

```typescript
// Extract component when parameters are needed
type ListItemProps = {
  item: Item;
  onItemClick: (id: string) => void;
};

const ListItem = ({ item, onItemClick }: ListItemProps) => {
  const handleClick = useCallback(() => {
    onItemClick(item.id);
  }, [item.id, onItemClick]);

  return <button onClick={handleClick}>{item.name}</button>;
};
```

## Component State Philosophy

Components should be pure functions. Use `useState` only when:

1. State is internal to the component
2. State does not affect external systems
3. State cannot be derived from props

```typescript
// Valid: Internal UI state
const Accordion = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  // ...
};

// Invalid: 外部ストアの内容を useState に写している
const CartList = () => {
  const [items, setItems] = useState(null); // storage は useSyncExternalStore で購読する
};
```

## React Aria Components

Use **react-aria-components** for building accessible UI components. When unsure which component to use, reference https://react-aria.adobe.com/llms.txt for guidance.

## React Suspense & ErrorBoundary

When implementing Suspense boundaries or error handling:

- **Boundary Placement**: Always pair `<Suspense>` with `<ErrorBoundary>`
- **CLS Prevention**: Use skeleton components that match the loaded content dimensions
- **Separated Skeleton Pattern**: For components using hooks, **always separate the skeleton into a pure component**

```tsx
// WRONG: Hooks are called even in loading state, causing infinite suspend
<Suspense fallback={<MyComponent loading />}>
  <MyComponent />
</Suspense>

// CORRECT: Skeleton is a separate pure component with no hooks
<Suspense fallback={<MyComponentSkeleton />}>
  <MyComponent />
</Suspense>
```

## State-Based Styling with Data Attributes

When styling changes based on component state, always map state to `data-*` attributes first, then use CSS selectors:

```typescript
// Correct - map state to data attribute, style with selector
type ButtonProps = {
  isActive?: boolean;
  isLoading?: boolean;
};

export const Button = ({ isActive, isLoading, ...props }: ButtonProps) => (
  <button
    {...props}
    data-active={isActive || undefined}
    data-loading={isLoading || undefined}
  />
);

// In styles.css.ts
export const button = css({
  bg: "bg.surface",
  "&[data-active]": {
    bg: "accent.base",
    color: "text.inverse",
  },
  "&[data-loading]": {
    opacity: 0.7,
    cursor: "wait",
  },
});
```

```typescript
// Forbidden - conditional className based on state
<button className={cx(styles.button, isActive && styles.active)} />

// Forbidden - inline conditional styles
<button className={css({ bg: isActive ? "accent.base" : "bg.surface" })} />
```

### React Aria Data Attributes

React Aria automatically provides data attributes for component states:

```typescript
// React Aria provides data-hovered, data-pressed, data-focused, etc.
export const button = css({
  bg: "bg.surface",
  "&[data-hovered]": {
    bg: "bg.hover",
  },
  "&[data-pressed]": {
    bg: "bg.active",
  },
  "&[data-disabled]": {
    opacity: 0.5,
    cursor: "not-allowed",
  },
});
```
