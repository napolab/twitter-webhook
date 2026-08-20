import { css } from "../../styled-system/css";

// Visually aligns with x.com's own 34.75px round action icons (like/reply/bookmark):
// transparent background, currentColor icon, no border/shadow so it reads as a native
// action, not an injected widget. Only color is themed via tokens per state.
export const root = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "34.75px",
  height: "34.75px",
  padding: "0",
  border: "none",
  borderRadius: "full",
  bg: "transparent",
  color: "fg.subtle",
  cursor: "pointer",
  transitionProperty: "color",
  transitionDuration: "fast",
  transitionTimingFunction: "stepSnap",
  _hover: { color: "accent.text" },
  _focusVisible: { layerStyle: "focusRing" },
  '&[data-state="success"]': { color: "accent.text" },
  '&[data-state="error"]': { color: "danger.text" },
  "@media (prefers-reduced-motion: reduce)": { transitionDuration: "instant" },
});

// Applied directly to SpinnerIcon (via its `className` prop) rather than as a child
// selector on `root`, per this repo's "no child selectors" rule.
export const spinner = css({
  animation: "spin 0.9s linear infinite",
  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
});

// Raw CSS text (not a Panda `css()` class) for `:host` — the shadow HOST
// element (`<twitter-webhook-button>`) lives in x.com's light DOM, one flex
// child among the action bar's own icon-button wrappers. `:host` is the only
// selector that reaches that element's own box from inside our stylesheet;
// Panda's `css()` only emits class-scoped rules; a class we apply to
// something WE render can't target the host itself.
//
// Passed as `options.css` on this UI's own `createShadowRootUi` call (WXT's
// per-UI "additional styles" field), not folded into the shared entry CSS
// bundle that `cssInjectionMode: "ui"` loads into every shadow root in this
// entry — so this rule applies ONLY to the button's shadow host and never to
// the toast UI's shadow host (mounted via a separate `createShadowRootUi`
// call that doesn't receive this option).
//
// Without this: the host defaults to a plain block box that stretches to
// fill x.com's action-bar row (its own `align-items` isn't `center` on every
// page — the timeline happened to look fine only because that row is short),
// and the button renders at the TOP of that stretched box instead of
// centered. `display: inline-flex; align-items: center` makes the host center
// its own rendered content; `align-self: center` makes the host center
// *itself* within the row regardless of the row's own `align-items`, and
// keeps the host sized to its content (34.75px) instead of stretching and
// growing the row.
export const hostAlignment = `:host {
  display: inline-flex !important;
  align-items: center !important;
  align-self: center !important;
}`;
