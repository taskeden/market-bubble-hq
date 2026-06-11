"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { craftHostTweet } from "@/lib/data/engine";
import { getRoster } from "@/lib/data/roster";
import { craftChannelMessage, TEXT_CHANNEL_IDS } from "./lounge-channels";

// ─── The lounge's lively crowd, per channel ───────────────────────────────────
// The hero chat + Chat Terminal are LIVE-only (real messages only — a hard
// product rule). The Community lounge is the opposite: an always-on hangout, so
// each text channel runs its OWN simulated buffer of bot chatter, independent of
// hq-store. Seeded backlog + a calm drip into whichever channel you're viewing.

const CAP = 180;
const ONLINE = getRoster().filter((u) => u.online).length;
const SEED_SIZE: Record<string, number> = {
  general: 42,
  stocks: 30,
  crypto: 28,
  ai: 28,
  memes: 24,
  nfts: 20,
};

/** A believable backlog for one channel, spread across the last ~3h with some
    author clusters (to show grouping) and — for general — a few host tweets. */
function seedChannel(channelId: string, count: number): ChatMessage[] {
  const now = Date.now();
  const out: ChatMessage[] = [];
  let ts = now - 3 * 60 * 60_000;
  const step = (3 * 60 * 60_000) / count;

  for (let i = 0; i < count; i++) {
    ts += step * (0.5 + Math.random());
    if (ts > now - 4000) ts = now - 4000;

    if (channelId === "general" && i > count * 0.4 && Math.random() > 0.9) {
      out.push(craftHostTweet(Math.round(ts)));
      continue;
    }

    const m = craftChannelMessage(channelId, Math.round(ts));
    out.push(m);

    // Occasional quick follow-up from the same author → Discord-style runs.
    if (Math.random() > 0.8) {
      ts += 2000 + Math.random() * 9000;
      if (ts <= now - 2000) {
        out.push({
          ...craftChannelMessage(channelId, Math.round(ts)),
          userId: m.userId,
          username: m.username,
          displayName: m.displayName,
          platform: m.platform,
          source: m.source,
          role: m.role,
        });
      }
    }
  }
  return out;
}

export function useLoungeFeed(channel: string) {
  const [buffers, setBuffers] = useState<Record<string, ChatMessage[]>>({});
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const channelRef = useRef(channel);
  channelRef.current = channel;

  // Seed every text channel once on mount (client-only — random/timestamps).
  useEffect(() => {
    const seeded: Record<string, ChatMessage[]> = {};
    for (const c of TEXT_CHANNEL_IDS) seeded[c] = seedChannel(c, SEED_SIZE[c] ?? 24);
    setBuffers(seeded);
  }, []);

  const ready = Object.keys(buffers).length > 0;

  // Calm drip into the ACTIVE text channel (voice has no feed). Cadence is
  // readable (premium hangout, not a firehose): ~3–7s, small bursts.
  useEffect(() => {
    if (!ready || !TEXT_CHANNEL_IDS.includes(channel)) return;
    let alive = true;
    let msgTimer: ReturnType<typeof setTimeout>;
    let tweetTimer: ReturnType<typeof setTimeout>;

    const drip = () => {
      if (!alive) return;
      const burst = Math.random() > 0.85 ? 2 : 1;
      const batch: ChatMessage[] = [];
      for (let i = 0; i < burst; i++) batch.push(craftChannelMessage(channel, Date.now() + i));
      setBuffers((prev) => ({ ...prev, [channel]: [...(prev[channel] ?? []), ...batch].slice(-CAP) }));
      msgTimer = setTimeout(drip, 3000 + Math.random() * 4000);
    };
    msgTimer = setTimeout(drip, 3500);

    if (channel === "general") {
      const tweet = () => {
        if (!alive) return;
        setBuffers((prev) => ({ ...prev, general: [...(prev.general ?? []), craftHostTweet()].slice(-CAP) }));
        tweetTimer = setTimeout(tweet, 60_000 + Math.random() * 50_000);
      };
      tweetTimer = setTimeout(tweet, 28_000 + Math.random() * 20_000);
    }

    return () => {
      alive = false;
      clearTimeout(msgTimer);
      clearTimeout(tweetTimer);
    };
  }, [ready, channel]);

  const hide = (id: string) => setHidden((h) => new Set(h).add(id));

  // Active channel's visible messages.
  const messages = useMemo(() => {
    const buf = buffers[channel] ?? [];
    return hidden.size ? buf.filter((m) => !hidden.has(m.id)) : buf;
  }, [buffers, channel, hidden]);

  // Server-wide recent speakers (for the member list) — merged across channels.
  const floor = useMemo(() => {
    const all: ChatMessage[] = [];
    for (const c of TEXT_CHANNEL_IDS) all.push(...(buffers[c] ?? []));
    return all.sort((a, b) => a.timestamp - b.timestamp).slice(-160);
  }, [buffers]);

  const onFloor = useMemo(() => {
    const ids = new Set<string>();
    for (const m of floor) if (m.kind === "chat") ids.add(m.userId);
    return ids.size + ONLINE;
  }, [floor]);

  return { messages, floor, hide, onFloor };
}
