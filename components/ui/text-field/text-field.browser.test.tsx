import { page } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { TextField } from "./index";

describe("TextField", () => {
  it("renders a textbox with the label as accessible name", async () => {
    render(<TextField label="webhook url" name="url" />);
    const input = page.getByRole("textbox", { name: "webhook url" });
    await expect.element(input).toBeInTheDocument();
    await expect.element(input).toHaveProperty("tagName", "INPUT");
  });

  it("shows the error message when isInvalid and errorMessage are provided", async () => {
    render(<TextField label="webhook url" isInvalid errorMessage="Required" />);
    await expect.element(page.getByText("Required")).toBeVisible();
  });

  it("does not render error text when not invalid", async () => {
    render(<TextField label="webhook url" errorMessage="Required" />);
    await expect.element(page.getByText("Required")).not.toBeInTheDocument();
  });
});
