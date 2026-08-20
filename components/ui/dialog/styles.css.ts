import { css } from "../../../styled-system/css";

export const overlay = css({
  position: "fixed",
  inset: "0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  p: "4",
  bg: "overlay",
});

// Base shell only — flush stack (gap "0"): sections are divided by 1px borders
// rather than gap, so each consumer (e.g. confirm-dialog) owns its own section
// padding/border-bottom/border-top dividers.
export const root = css({
  width: "full",
  display: "flex",
  flexDirection: "column",
  gap: "0",
  bg: "bg.canvas",
  borderWidth: "default",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "none",
});
