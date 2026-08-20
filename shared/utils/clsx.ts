// Minimal className joiner (no library install per project rules). Filters
// out falsy values so callers can pass `condition && "class"` / `undefined`.
export const clsx = (...values: Array<string | undefined | null | false>): string =>
  values.filter((value): value is string => Boolean(value)).join(" ");
