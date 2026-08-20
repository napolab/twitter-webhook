type TweetInfo = { url: string; postedAt: string };

const extractFromLocation = (locationHref: string): string | undefined => {
  const matched = locationHref.match(/^https:\/\/(?:x|twitter)\.com\/[^/]+\/status\/\d+/);
  return matched?.[0];
};

export const extractTweetInfo = (article: Element, locationHref: string): TweetInfo | undefined => {
  const timeLink = article.querySelector('a[href*="/status/"]:has(time)');
  const time = timeLink?.querySelector("time") ?? article.querySelector("time");
  const postedAt = time?.getAttribute("datetime");
  if (!postedAt) return undefined;

  const href = timeLink?.getAttribute("href");
  if (href) return { url: new URL(href, "https://x.com").toString(), postedAt };

  const url = extractFromLocation(locationHref);
  if (!url) return undefined;
  return { url, postedAt };
};
