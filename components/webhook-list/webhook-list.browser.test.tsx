import { page } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { WebhookList } from "./index";

import type { Webhook } from "@/shared/webhooks/schema";

const webhook: Webhook = {
  id: "a",
  name: "alerts",
  url: "https://discord.com/api/webhooks/1/x",
  type: "discord",
  enabled: true,
};

describe("WebhookList", () => {
  it("shows an empty-state message when webhooks is empty", async () => {
    render(<WebhookList webhooks={[]} onToggle={() => {}} onDelete={() => {}} />);
    await expect.element(page.getByText(/未登録/)).toBeInTheDocument();
    expect(page.getByRole("list").query()).toBeNull();
  });

  it("renders a row per webhook as a list", async () => {
    render(<WebhookList webhooks={[webhook]} onToggle={() => {}} onDelete={() => {}} />);
    await expect.element(page.getByRole("list")).toBeInTheDocument();
    await expect.element(page.getByText("alerts")).toBeInTheDocument();
  });
});
