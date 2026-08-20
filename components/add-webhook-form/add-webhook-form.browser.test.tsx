import { page } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { AddWebhookForm } from "./index";

describe("AddWebhookForm", () => {
  it("submits valid input", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<AddWebhookForm onSubmit={onSubmit} />);
    await page.getByLabelText("NAME").fill("alerts");
    await page.getByLabelText("URL").fill("https://discord.com/api/webhooks/1/x");
    await page.getByRole("button", { name: "ADD" }).click();
    expect(onSubmit).toHaveBeenCalledWith({
      name: "alerts",
      url: "https://discord.com/api/webhooks/1/x",
    });
  });

  it("shows error for non-discord URL and does not submit", async () => {
    const onSubmit = vi.fn();
    render(<AddWebhookForm onSubmit={onSubmit} />);
    await page.getByLabelText("NAME").fill("x");
    await page.getByLabelText("URL").fill("https://example.com");
    await page.getByRole("button", { name: "ADD" }).click();
    expect(onSubmit).not.toHaveBeenCalled();
    await expect.element(page.getByText(/discord/i)).toBeVisible();
  });
});
