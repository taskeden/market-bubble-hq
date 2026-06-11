import { NextResponse } from "next/server";

// Live-chat proxy for the YouTube stream (innertube — no API key, no quota).
// youtube.com blocks browser CORS, so the client adapter polls this route:
//   GET /api/youtube/chat?video=<id>                 → first batch + continuation
//   GET /api/youtube/chat?video=<id>&continuation=…  → next batch + continuation
// Flow verified end-to-end: youtubei/v1/next yields the conversation bar's
// reload continuation; youtubei/v1/live_chat/get_live_chat yields messages and
// the rolling continuation + recommended poll interval.

export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8"; // public WEB client key
const CLIENT = { clientName: "WEB", clientVersion: "2.20240613.01.00", hl: "en", gl: "US" };

type WireMessage = {
  id: string;
  author: string;
  text: string;
  timestamp: number;
  role?: "member" | "mod" | "founder";
};

async function innertube(endpoint: string, body: Record<string, unknown>) {
  const r = await fetch(`https://www.youtube.com/youtubei/v1/${endpoint}?key=${INNERTUBE_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA },
    body: JSON.stringify({ context: { client: CLIENT }, ...body }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`innertube ${endpoint} HTTP ${r.status}`);
  return r.json();
}

/** The live chat continuation for a video (or null when chat is unavailable). */
async function resolveContinuation(videoId: string): Promise<string | null> {
  const next = await innertube("next", { videoId });
  const bar = next?.contents?.twoColumnWatchNextResults?.conversationBar;
  return bar?.liveChatRenderer?.continuations?.[0]?.reloadContinuationData?.continuation ?? null;
}

// innertube payloads are deep ad-hoc JSON — typed loosely on purpose.
// eslint-disable-next-line
function parseChat(payload: any): { messages: WireMessage[]; continuation: string | null; pollMs: number } {
  const cc = payload?.continuationContents?.liveChatContinuation;
  const messages: WireMessage[] = [];
  for (const action of cc?.actions ?? []) {
    const item = action?.addChatItemAction?.item?.liveChatTextMessageRenderer;
    if (!item) continue;
    const text = (item.message?.runs ?? [])
      // eslint-disable-next-line
      .map((run: any) => run.text ?? run.emoji?.shortcuts?.[0] ?? "")
      .join("")
      .trim();
    if (!text) continue;
    const badges = JSON.stringify(item.authorBadges ?? "");
    messages.push({
      id: item.id ?? `${item.timestampUsec}_${messages.length}`,
      author: item.authorName?.simpleText ?? "viewer",
      text,
      timestamp: item.timestampUsec ? Math.round(Number(item.timestampUsec) / 1000) : Date.now(),
      role: /OWNER/.test(badges) ? "founder" : /MODERATOR/.test(badges) ? "mod" : "member",
    });
  }
  const contData = cc?.continuations?.[0] ?? {};
  const continuation =
    contData.invalidationContinuationData?.continuation ??
    contData.timedContinuationData?.continuation ??
    contData.reloadContinuationData?.continuation ??
    null;
  const pollMs =
    contData.invalidationContinuationData?.timeoutMs ?? contData.timedContinuationData?.timeoutMs ?? 3500;
  return { messages, continuation, pollMs: Math.max(1500, pollMs) };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const video = url.searchParams.get("video");
  let continuation = url.searchParams.get("continuation");
  if (!video && !continuation) {
    return NextResponse.json({ error: "video required" }, { status: 400 });
  }

  try {
    if (!continuation) {
      continuation = await resolveContinuation(video!);
      if (!continuation) return NextResponse.json({ disabled: true });
    }
    const chat = await innertube("live_chat/get_live_chat", { continuation });
    return NextResponse.json(parseChat(chat));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "live chat fetch failed" },
      { status: 502 }
    );
  }
}
