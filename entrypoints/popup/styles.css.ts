import { css } from "../../styled-system/css";

export const root = css({
  display: "flex",
  flexDirection: "column",
  gap: "2",
  w: "360px",
  minH: "320px",
  bg: "bg.canvas",
  p: "3",
});

export const title = css({
  fontFamily: "mono",
  fontSize: "sm",
  fontWeight: "semibold",
  letterSpacing: "wider",
  color: "fg.default",
});

export const sectionLabel = css({
  fontFamily: "mono",
  fontSize: "xs",
  fontWeight: "semibold",
  letterSpacing: "wider",
  color: "fg.muted",
  pt: "2",
  borderTopWidth: "default",
  borderTopStyle: "solid",
  borderTopColor: "border.subtle",
});

export const srOnly = css({ srOnly: true });

// Skeleton rows match WebhookRow's own footprint (minH: targetMin, same border) so the
// suspense fallback doesn't cause a layout shift once the real list resolves.
export const skeletonRoot = css({
  display: "flex",
  flexDirection: "column",
  gap: "1",
});

export const skeletonRow = css({
  minH: "targetMin",
  bg: "bg.muted",
  borderWidth: "default",
  borderStyle: "solid",
  borderColor: "border.subtle",
  animation: "skeletonPulse 1.2s ease-in-out infinite",
  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
});

export const errorRoot = css({
  display: "flex",
  flexDirection: "column",
  gap: "2",
  p: "2",
  borderWidth: "default",
  borderStyle: "solid",
  borderColor: "danger.border",
});

export const errorMessage = css({
  fontFamily: "mono",
  fontSize: "xs",
  color: "danger.text",
});
