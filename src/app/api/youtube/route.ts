import { NextResponse } from "next/server";
import { SITE } from "@/lib/config";

// Featured-stream resolver for the Market Bubble channel.
// 1. Detects a currently-live broadcast (the /live watch page exposes it).
// 2. Falls back to the most recent upload via the channel RSS feed.
// Both are public endpoints — no API key required — and responses are cached so
// we don't hammer YouTube on every page load.

export const revalidate = 60;

const CHANNEL_ID =
  process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || SITE.youtube.channelId;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export type FeaturedStream = {
  live: boolean;
  videoId: string | null;
  title: string | null;
  publishedAt: string | null;
  url: string | null;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Returns the live video when the channel is streaming, otherwise null. */
async function detectLive(
  channelId: string
): Promise<{ videoId: string; title: string } | null> {
  try {
    const res = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
      headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    // A canonical watch link + an isLive flag only appear while actually live.
    const isLive = /"isLive(?:Now|Broadcast)?":\s*true/.test(html);
    const canonical = html.match(
      /<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([0-9A-Za-z_-]{11})">/
    );
    if (!isLive || !canonical) return null;
    const title =
      html.match(/<meta name="title" content="([^"]*)">/)?.[1] ??
      html.match(/<title>([^<]*)<\/title>/)?.[1] ??
      "Live now";
    return { videoId: canonical[1], title: decodeEntities(title).replace(/ - YouTube$/, "") };
  } catch {
    return null;
  }
}

type Upload = { videoId: string; title: string; publishedAt: string };

function parseEntries(xml: string): Upload[] {
  // RSS entries are ordered newest-first.
  return xml
    .split("<entry>")
    .slice(1)
    .map((entry) => ({
      videoId: entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? "",
      title: decodeEntities(entry.match(/<title>([^<]*)<\/title>/)?.[1] ?? "Latest episode"),
      publishedAt: entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? "",
    }))
    .filter((e) => e.videoId);
}

/**
 * Shorts vs. long-form: requesting /shorts/<id> serves a 200 for a real Short
 * but redirects to /watch?v=<id> for a regular video. No API key needed.
 */
async function isShort(videoId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
      method: "HEAD",
      headers: { "user-agent": UA },
      redirect: "manual",
      next: { revalidate: 3600 },
    });
    return res.status === 200; // a redirect (or opaqueredirect) means long-form
  } catch {
    return false; // on error, don't exclude — better to show it than skip everything
  }
}

/** Most recent long-form upload (skips Shorts) from the channel's Atom feed. */
async function latestLongForm(channelId: string): Promise<Upload | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { headers: { "user-agent": UA }, next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const entries = parseEntries(await res.text());
    if (!entries.length) return null;
    for (const entry of entries.slice(0, 10)) {
      if (!(await isShort(entry.videoId))) return entry;
    }
    return entries[0]; // every recent upload is a Short — fall back to the newest
  } catch {
    return null;
  }
}

export async function GET() {
  const live = await detectLive(CHANNEL_ID);
  if (live) {
    return NextResponse.json<FeaturedStream>({
      live: true,
      videoId: live.videoId,
      title: live.title,
      publishedAt: null,
      url: `https://www.youtube.com/watch?v=${live.videoId}`,
    });
  }

  const latest = await latestLongForm(CHANNEL_ID);
  return NextResponse.json<FeaturedStream>({
    live: false,
    videoId: latest?.videoId ?? null,
    title: latest?.title ?? null,
    publishedAt: latest?.publishedAt ?? null,
    url: latest ? `https://www.youtube.com/watch?v=${latest.videoId}` : SITE.youtube.url,
  });
}
