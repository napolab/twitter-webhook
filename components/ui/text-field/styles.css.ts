import { css } from "../../../styled-system/css";

export const field = css({
  display: "flex",
  flexDirection: "column",
  gap: "1",
});

// Mono micro-label — de-emphasised so the boxed input stays the focal point.
export const label = css({
  fontFamily: "mono",
  fontWeight: "semibold",
  fontSize: "2xs",
  color: "fg.muted",
});

// Row that holds the <input>, sharing the field border. react-aria does not
// set data-focused/data-invalid on this inner div, so the border state is
// driven from CSS state pseudo-classes (:focus-within reacts to the nested
// Input; :has([aria-invalid]) reacts to react-aria's invalid attribute).
export const inputRow = css({
  position: "relative",
  display: "flex",
  alignItems: "center",
  width: "full",
  borderWidth: "hairline",
  borderStyle: "solid",
  borderColor: "border.default",
  transitionProperty: "border-color",
  transitionDuration: "fast",
  transitionTimingFunction: "stepSnap",
  "&:focus-within": { borderColor: "accent.border" },
  '&:has([aria-invalid="true"])': { borderColor: "danger.border" },
  "@media (prefers-reduced-motion: reduce)": {
    transitionDuration: "instant",
  },
});

// Boxed hairline input. Border ownership lives on inputRow, so the input
// itself stays borderless and transparent.
export const input = css({
  flex: "1",
  minW: "0",
  paddingInline: "element",
  paddingBlock: "1",
  fontFamily: "body",
  fontSize: "sm",
  color: "fg.default",
  bg: "transparent",
  borderWidth: "0",
  borderStyle: "solid",
  borderColor: "transparent",
  borderRadius: "none",
  outline: "none",
  "&[data-focus-visible]": { outline: "none" },
});

export const error = css({
  fontFamily: "mono",
  fontWeight: "semibold",
  fontSize: "2xs",
  color: "danger.text",
});
