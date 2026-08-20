---
description: "Design function parameter / component prop types from the function's own perspective — never propagate caller-side nullability"
paths:
  - "src/**/*.{ts,tsx}"
---

Design function / method parameter types and component prop types from the **function's own perspective**. Never widen the signature to accommodate what callers happen to hold.

## The rule

- Optional values use `T` (= `T | undefined`) only. Never `T | null` and never `T | null | undefined` in a function's input contract.
- `null` is an upstream / wire-format concern (DOM API の戻り値、JSON APIs、`browser.storage` の読み出し)。Coerce at the boundary — the _caller's_ responsibility — with `value ?? undefined`.
- This applies to every input type: component props, function parameters, method signatures, type aliases used as inputs.

## Why

`null` and `undefined` both mean "absent." Allowing both forces every reader to handle two cases, and leaks an upstream concern (wire NULL) into the function body. Coerce at the boundary; keep the inside working with one absent-case.

## Boundary coercion

Where the boundary is depends on the upstream:

| Upstream                             | Where to coerce                               |
| ------------------------------------ | --------------------------------------------- |
| `querySelector` / `dataset` (null 返し) | DOM をパースするアダプタ層                    |
| BOOTH の API / HTML レスポンス          | パーサ (`parseCartItem` 等) の中             |
| `browser.storage` の読み出し            | storage ラッパの中                            |
| `chrome.*` コールバックの引数           | Promise 化するラッパの中                      |

```tsx
// GOOD — narrow input contract
type Props = { note?: string };

const CartItemNote = ({ note }: Props) => note ? <p>{note}</p> : null;

// Caller bridges the boundary
<CartItemNote note={el.dataset.note ?? undefined} />
```

```tsx
// BAD — function accommodating caller's nullable shape
type Props = { note?: string | null };
//                       ^^^^^^^^^^^^^^^^ leaks the DOM's null into every consumer

// BAD — same issue, more verbose
type Props = { note: string | null | undefined };
```

## Red flags

- `type Props = { ... | null` — almost always wrong inside a function's input type
- `Foo | null | undefined` anywhere in a function parameter — collapse to `Foo?`
- `if (x === null)` branch inside a pure function — upstream concern leaked inward; coerce earlier

## Does NOT apply to

- **`@types/chrome` / WXT の生成型** — never edit; coerce at the consumer.
- **External API response / DB row types** — those legitimately describe upstream reality where `null` is the wire format. Don't rewrite them — coerce when consuming.
- **Discriminated-union member shapes** where `null` is a deliberate sentinel distinct from `undefined`. Rare; usually a separate variant is cleaner:

  ```ts
  // Sometimes legitimate: `null` = "explicitly cleared" vs `undefined` = "not set"
  type FilterState = { dateFrom: Date | null };

  // Usually cleaner:
  type FilterState = { dateFrom: { kind: 'cleared' } | { kind: 'set'; value: Date } };
  ```

## Quick check before writing a `type Props = ...`

1. Is this an _input_ type (consumed by your function/component)? Use `T` or `T?`.
2. Is this an _output_ type (returned by a fetch / DB query / parser)? `T | null` is fine if upstream uses NULL.
3. If both — split into two types. Define the wire shape and the consumed shape separately.
