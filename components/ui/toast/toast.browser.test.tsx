import { page } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { appToastQueue, ToastContainer } from "./index";

describe("ToastContainer", () => {
  it("renders queued toasts with their title and a matching data-variant", async () => {
    render(<ToastContainer />);

    appToastQueue.add(
      { title: "webhook に送信しました (1件)", variant: "success" },
      { timeout: 4000 },
    );
    appToastQueue.add(
      { title: "送信失敗: no enabled webhooks", variant: "error" },
      { timeout: 6000 },
    );

    const successToast = page
      .getByRole("alertdialog")
      .filter({ hasText: "webhook に送信しました" });
    await expect.element(successToast).toHaveAttribute("data-variant", "success");

    const errorToast = page.getByRole("alertdialog").filter({ hasText: "送信失敗" });
    await expect.element(errorToast).toHaveAttribute("data-variant", "error");
  });
});
