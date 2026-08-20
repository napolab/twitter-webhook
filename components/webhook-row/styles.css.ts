import { css } from "../../styled-system/css";

export const root = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  px: "2",
  minH: "targetMin",
  borderWidth: "default",
  borderStyle: "solid",
  borderColor: "border.default",
});

export const info = css({
  display: "flex",
  flexDirection: "column",
  gap: "1",
  flex: "1",
  minW: "0",
});

export const name = css({
  fontFamily: "mono",
  fontSize: "sm",
  fontWeight: "semibold",
  color: "fg.default",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const url = css({
  fontFamily: "mono",
  fontSize: "2xs",
  color: "fg.muted",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

// 24px 角のトグル。&[data-selected] で accent 塗り。
export const toggle = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: "0",
  w: "targetMin",
  h: "targetMin",
  minW: "targetMin",
  minH: "targetMin",
  p: "0",
  bg: "transparent",
  color: "fg.default",
  borderWidth: "default",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "none",
  cursor: "pointer",
  transitionProperty: "transform, background-color, color",
  transitionDuration: "snap",
  transitionTimingFunction: "stepSnap",
  _hover: { transform: "translate(2px, 2px)" },
  _focusVisible: { layerStyle: "focusRing" },
  "&[data-selected]": { bg: "accent.solid", color: "fg.onSolid", borderColor: "accent.solid" },
  "@media (prefers-reduced-motion: reduce)": {
    transitionDuration: "instant",
    _hover: { transform: "none" },
  },
});

// 枠なしのアイコンボタン。ui/button の size="icon" と footprint (targetMin 角) は揃えつつ
// 枠を持たない — 行の中で名前/URL/トグルの隣に並ぶだけの控えめな削除操作のため。
export const deleteButton = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: "0",
  minH: "targetMin",
  minW: "targetMin",
  px: "1",
  bg: "transparent",
  color: "danger.text",
  cursor: "pointer",
  transitionProperty: "transform, background-color, color",
  transitionDuration: "snap",
  transitionTimingFunction: "stepSnap",
  _hover: { transform: "translate(2px, 2px)" },
  _focusVisible: { layerStyle: "focusRing" },
  "@media (prefers-reduced-motion: reduce)": {
    transitionDuration: "instant",
    _hover: { transform: "none" },
  },
});
