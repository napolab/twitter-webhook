import { describe, expect, it } from "vitest";
import { extractTweetInfo } from "./extract";

const timelineArticle = () => {
  const article = document.createElement("article");
  article.innerHTML = `
    <div><a href="/napolab/status/123"><time datetime="2026-08-20T03:00:00.000Z">8月20日</time></a></div>
    <div role="group"><button data-testid="bookmark"></button></div>`;
  return article;
};

const detailArticle = () => {
  const article = document.createElement("article");
  article.innerHTML = `
    <div><time datetime="2026-08-20T03:00:00.000Z">午後0:00 · 2026年8月20日</time></div>
    <div role="group"><button data-testid="bookmark"></button></div>`;
  return article;
};

describe("extractTweetInfo", () => {
  it("extracts from timeline article (time inside status link)", () => {
    expect(extractTweetInfo(timelineArticle(), "https://x.com/home")).toEqual({
      url: "https://x.com/napolab/status/123",
      postedAt: "2026-08-20T03:00:00.000Z",
    });
  });

  it("falls back to location for detail page main tweet", () => {
    expect(extractTweetInfo(detailArticle(), "https://x.com/napolab/status/123?s=20")).toEqual({
      url: "https://x.com/napolab/status/123",
      postedAt: "2026-08-20T03:00:00.000Z",
    });
  });

  it("returns undefined when no time element", () => {
    const article = document.createElement("article");
    expect(extractTweetInfo(article, "https://x.com/home")).toBeUndefined();
  });
});
