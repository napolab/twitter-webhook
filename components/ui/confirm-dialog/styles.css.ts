import { css } from "../../../styled-system/css";

// Sizing only — the shell (overlay, bg, border, flush gap:"0" layout) lives
// in ui/dialog. Sections below are divided by 1px borders instead of gap.
export const root = css({
  width: "full",
  maxW: "[24rem]",
});

export const titleRoot = css({
  p: "3",
  borderBottomWidth: "default",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
});

export const title = css({
  fontFamily: "mono",
  fontSize: "md",
  fontWeight: "semibold",
  color: "fg.default",
});

export const message = css({
  p: "3",
  fontFamily: "mono",
  fontSize: "sm",
  color: "fg.muted",
});

export const actions = css({
  display: "flex",
  justifyContent: "flex-end",
  gap: "2",
  p: "3",
  borderTopWidth: "default",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
});
