import { page } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { Button } from "./index";

describe("Button", () => {
  it("fires onPress and carries data-variant", async () => {
    const onPress = vi.fn();
    render(
      <Button variant="danger" onPress={onPress}>
        Delete
      </Button>,
    );
    const button = page.getByRole("button", { name: "Delete" });
    await expect.element(button).toHaveAttribute("data-variant", "danger");
    await button.click();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("defaults to variant solid and size md", async () => {
    render(<Button>Send</Button>);
    const button = page.getByRole("button", { name: "Send" });
    await expect.element(button).toHaveAttribute("data-variant", "solid");
    await expect.element(button).toHaveAttribute("data-size", "md");
  });

  it("reflects size icon via data-size", async () => {
    render(
      <Button size="icon" aria-label="delete">
        <svg aria-hidden="true" />
      </Button>,
    );
    const button = page.getByRole("button", { name: "delete" });
    await expect.element(button).toHaveAttribute("data-size", "icon");
  });
});
