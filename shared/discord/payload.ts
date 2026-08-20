import dayjs from "dayjs";

type BuildDiscordPayloadInput = { url: string; postedAt: string };

export const buildDiscordPayload = (input: BuildDiscordPayloadInput): { content: string } => {
  const unix = dayjs(input.postedAt).unix();
  return { content: `${input.url}\n<t:${unix}:f>` };
};
