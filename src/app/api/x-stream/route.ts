import { NextResponse } from "next/server";
import { HOSTS, HOST_ORDER } from "@/lib/config";

// X relay — the hosts' own posts, streamed to the chat as SSE.
// X's API requires a server-held bearer token (no free/anonymous read path),
// so without X_BEARER_TOKEN this route reports "not configured" and the client
// adapter shows the X rows as such — honestly silent, never simulated.
//
//   GET /api/x-stream?probe=1 → { configured }
//   GET /api/x-stream         → SSE; polls each host's timeline every 60s and
//                               emits new posts: { id, host, user, display, text, timestamp }

export const dynamic = "force-dynamic";

const TOKEN = process.env.X_BEARER_TOKEN;
const POLL_MS = 60_000;

async function xApi(path: string) {
  const r = await fetch(`https://api.twitter.com/2${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`X API ${path} HTTP ${r.status}`);
  return r.json();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("probe")) {
    return NextResponse.json({ configured: Boolean(TOKEN) });
  }
  if (!TOKEN) {
    return NextResponse.json({ error: "X_BEARER_TOKEN not configured" }, { status: 501 });
  }

  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      const sinceIds = new Map<string, string>();
      const userIds = new Map<string, string>();

      try {
        const handles = HOST_ORDER.map((h) => HOSTS[h].handle).join(",");
        const users = await xApi(`/users/by?usernames=${handles}`);
        for (const u of users.data ?? []) {
          const host = HOST_ORDER.find(
            (h) => HOSTS[h].handle.toLowerCase() === String(u.username).toLowerCase()
          );
          if (host) userIds.set(host, u.id);
        }
      } catch (e) {
        controller.enqueue(
          encoder.encode(`event: relay_error\ndata: ${JSON.stringify(String(e))}\n\n`)
        );
        controller.close();
        return;
      }

      const poll = async () => {
        for (const host of HOST_ORDER) {
          const id = userIds.get(host);
          if (!id) continue;
          try {
            const since = sinceIds.get(host);
            const qs = new URLSearchParams({
              max_results: "5",
              exclude: "retweets,replies",
              "tweet.fields": "created_at",
            });
            if (since) qs.set("since_id", since);
            const tl = await xApi(`/users/${id}/tweets?${qs}`);
            const tweets = (tl.data ?? []).reverse(); // oldest first
            for (const t of tweets) {
              sinceIds.set(host, t.id);
              send({
                id: t.id,
                host,
                user: HOSTS[host].handle,
                display: HOSTS[host].label,
                text: t.text,
                timestamp: t.created_at ? Date.parse(t.created_at) : Date.now(),
              });
            }
          } catch {
            /* rate limit / transient — try again next cycle */
          }
        }
      };

      await poll();
      timer = setInterval(() => void poll(), POLL_MS);
    },
    cancel() {
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
