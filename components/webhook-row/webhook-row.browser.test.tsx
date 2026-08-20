import { page } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { WebhookRow } from "./index";

import type { Webhook } from "@/shared/webhooks/schema";

const webhook: Webhook = {
  id: "a",
  name: "alerts",
  url: "https://discord.com/api/webhooks/1/x",
  type: "discord",
  enabled: true,
};

describe("WebhookRow", () => {
  it("toggle calls onToggle with flipped enabled", async () => {
    const onToggle = vi.fn();
    render(<WebhookRow webhook={webhook} onToggle={onToggle} onDelete={() => {}} />);
    await page.getByRole("button", { name: /有効/ }).click();
    expect(onToggle).toHaveBeenCalledWith("a", false);
  });

  it("delete requires confirmation", async () => {
    const onDelete = vi.fn();
    render(<WebhookRow webhook={webhook} onToggle={() => {}} onDelete={onDelete} />);
    await page.getByRole("button", { name: /削除/ }).click();
    expect(onDelete).not.toHaveBeenCalled(); // dialog が開くだけ
    await page.getByRole("button", { name: "DELETE" }).click();
    expect(onDelete).toHaveBeenCalledWith("a");
  });
});
