import { css } from "../../styled-system/css";

// Cannelloni's own rename-playlist-dialog (a live-edit form) uses gap: 'element' (12px) —
// its own docs (.claude/rules/ui-ux.md) frame that as the deliberate exception to the app's
// dense 4-8px baseline, reasoned for its label/input/warning/buttons each changing on their
// own. This popup is smaller and denser end-to-end (ギチギチ per user directive), so we
// override that guidance here and use gap: '2' (8px) instead — still enough to read each
// field as separate, but tighter than the Electron dialog's roomier chrome.
export const root = css({
  display: "flex",
  flexDirection: "column",
  gap: "2",
});

export const actions = css({
  display: "flex",
  justifyContent: "flex-end",
  gap: "2",
});
