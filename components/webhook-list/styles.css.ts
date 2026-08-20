import { css } from "../../styled-system/css";

export const root = css({
  display: "flex",
  flexDirection: "column",
  gap: "1",
});

export const empty = css({
  p: "3",
  textAlign: "center",
  fontFamily: "mono",
  fontSize: "sm",
  color: "fg.muted",
});
