import { describe, expect, it } from "vitest";
import { buildDiscordPayload } from "./payload";

describe("buildDiscordPayload", () => {
  it("builds content with URL and discord timestamp", () => {
    const result = buildDiscordPayload({
      url: "https://x.com/user/status/123",
      postedAt: "2026-08-20T03:00:00.000Z",
    });
    expect(result).toEqual({
      content: "https://x.com/user/status/123\n<t:1787194800:f>",
    });
  });
});
