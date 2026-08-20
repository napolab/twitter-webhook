import { useCallback, useRef, useState } from "react";
import { Button } from "react-aria-components";

import { CheckIcon, SendIcon, SpinnerIcon } from "@/components/ui/icons";

import * as styles from "./styles.css";

import type { ReactElement } from "react";

type SendState = "idle" | "sending" | "success" | "error";
type SendButtonProps = { onSend: () => Promise<void> };

// Explicit `ReactElement` return type makes this exhaustive over `SendState` at
// compile time: if a variant is ever added without a matching `case`, the switch
// falls through without returning, and TypeScript rejects the missing return
// path against the annotated type (rather than silently inferring `| undefined`).
const iconFor = (state: SendState): ReactElement => {
  switch (state) {
    case "sending":
      return <SpinnerIcon className={styles.spinner} />;
    case "success":
      return <CheckIcon />;
    case "idle":
    case "error":
      return <SendIcon />;
  }
};

export const SendButton = ({ onSend }: SendButtonProps) => {
  const [state, setState] = useState<SendState>("idle");
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handlePress = useCallback(async () => {
    if (state === "sending") return;
    clearTimeout(resetTimerRef.current);
    setState("sending");
    try {
      await onSend();
      setState("success");
    } catch (error) {
      console.error("[twitter-webhook] send failed:", error);
      setState("error");
    } finally {
      resetTimerRef.current = setTimeout(() => setState("idle"), 2500);
    }
  }, [onSend, state]);

  return (
    <Button
      className={styles.root}
      data-state={state}
      aria-label="webhook に送信"
      onPress={handlePress}
    >
      {iconFor(state)}
    </Button>
  );
};
