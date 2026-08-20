import { css } from "../../styled-system/css";

export const root = css({
  display: "flex",
  flexDirection: "column",
  gap: "block",
  w: "360px",
  minH: "320px",
  bg: "bg.canvas",
  p: "page",
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
  pt: "element",
  borderTopWidth: "default",
  borderTopStyle: "solid",
  borderTopColor: "border.subtle",
});

export const srOnly = css({ srOnly: true });
