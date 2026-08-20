import { Suspense, useCallback } from "react";
import { useAtomCallback } from "jotai/utils";
import { ErrorBoundary } from "react-error-boundary";

import { Button } from "@/components/ui/button";

import { WebhookRequestError, webhooksAtom } from "./atoms";
import * as styles from "./styles.css";
import { WebhookSection } from "./webhook-section";

import type { FallbackProps } from "react-error-boundary";

const resolveErrorMessage = (error: unknown): string => {
  if (error instanceof WebhookRequestError) {
    return `webhook の読み込みに失敗しました (status: ${error.status})`;
  }
  return "webhook の読み込みに失敗しました";
};

const WebhookErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  const handleRetry = useAtomCallback(
    useCallback(
      (_get, set) => {
        set(webhooksAtom);
        resetErrorBoundary();
      },
      [resetErrorBoundary],
    ),
  );

  return (
    <div className={styles.errorRoot} role="alert">
      <p className={styles.errorMessage}>{resolveErrorMessage(error)}</p>
      <Button variant="danger" onPress={handleRetry}>
        再試行
      </Button>
    </div>
  );
};

const WebhookSkeleton = () => (
  <div className={styles.skeletonRoot} role="status" aria-live="polite">
    <span className={styles.srOnly}>読み込み中</span>
    <div className={styles.skeletonRow} aria-hidden="true" />
    <div className={styles.skeletonRow} aria-hidden="true" />
  </div>
);

export const App = () => (
  <main className={styles.root}>
    <h1 className={styles.title}>TWITTER WEBHOOK</h1>
    <ErrorBoundary FallbackComponent={WebhookErrorFallback}>
      <Suspense fallback={<WebhookSkeleton />}>
        <WebhookSection />
      </Suspense>
    </ErrorBoundary>
  </main>
);
