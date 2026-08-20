import { page } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { ConfirmDialog } from "./index";

describe("ConfirmDialog", () => {
  it("calls onConfirm when confirm button pressed", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="DELETE WEBHOOK"
        message="alerts を削除します"
        confirmLabel="DELETE"
        onConfirm={onConfirm}
        onClose={() => {}}
      />,
    );
    await page.getByRole("button", { name: "DELETE" }).click();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onClose and not onConfirm when cancel button pressed", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="DELETE WEBHOOK"
        message="alerts を削除します"
        confirmLabel="DELETE"
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );
    await page.getByRole("button", { name: "CANCEL" }).click();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
