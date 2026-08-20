import {
  Text,
  UNSTABLE_Toast as Toast,
  UNSTABLE_ToastContent as ToastContent,
  UNSTABLE_ToastQueue as ToastQueue,
  UNSTABLE_ToastRegion as ToastRegion,
} from "react-aria-components";

import * as styles from "./styles.css";

import type { QueuedToast } from "react-aria-components";

// react-aria-components@1.20.0 only exports the Toast API under an
// UNSTABLE_ prefix (Toast/ToastList/ToastRegion/ToastContent/ToastQueue) —
// there is no stable, unprefixed alternative in this version. Cannelloni's
// own `ui/toast/index.tsx` imports the same UNSTABLE_ names, so this matches
// the established pattern rather than working around a missing API.
export type AppToastContent = { title: string; variant: "success" | "error" };

// Module-scope queue — push a toast from anywhere via `appToastQueue.add()`.
export const appToastQueue = new ToastQueue<AppToastContent>({ maxVisibleToasts: 4 });

type AppToastProps = { toast: QueuedToast<AppToastContent> };

const AppToast = ({ toast }: AppToastProps) => (
  <Toast toast={toast} className={styles.toast} data-variant={toast.content.variant}>
    <ToastContent>
      <Text slot="title">{toast.content.title}</Text>
    </ToastContent>
  </Toast>
);

// Render once, near wherever the toast queue's consumer UI mounts.
export const ToastContainer = () => (
  <ToastRegion queue={appToastQueue} className={styles.region} aria-label="通知">
    {({ toast }) => <AppToast key={toast.key} toast={toast} />}
  </ToastRegion>
);
