import { css } from "../../../styled-system/css";

export const region = css({
  position: "fixed",
  insetBlockEnd: "4",
  insetInlineEnd: "4",
  // Above anything x.com's own page renders — the shadow root already blocks
  // its CSS from leaking in, but stacking context is still shared with the
  // page, and x.com's own overlays (modals, sticky headers) can carry very
  // high z-indices.
  zIndex: "[2147483647]",
  display: "flex",
  flexDirection: "column",
  gap: "2",
  outline: "none",
});

export const toast = css({
  display: "flex",
  alignItems: "center",
  minW: "[11rem]",
  maxW: "[20rem]",
  px: "3",
  py: "2",
  bg: "bg.canvas",
  borderWidth: "default",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "none",
  // Cannelloni's design system otherwise forbids box-shadow (1px borders +
  // bg.* steps carry depth instead) — a floating toast is the one sanctioned
  // exception, since it can land over arbitrary host-page content that a
  // flat border alone won't separate from visually. Matches Cannelloni's own
  // `ui/toast/styles.css.ts`.
  boxShadow: "lg",
  fontFamily: "mono",
  fontSize: "sm",
  color: "fg.default",
  '&[data-variant="success"]': { borderColor: "accent.solid", color: "accent.text" },
  '&[data-variant="error"]': { borderColor: "danger.solid", color: "danger.text" },
});
