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
