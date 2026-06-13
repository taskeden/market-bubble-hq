import type { ChatMessage } from "@/lib/types";

// A rolling, on-device log of the REAL chat (live mode only). The live feed is
// real-only, so it goes dead when the hosts are offline — persisting the last
// stretch of real conversation lets the feed open with that history instead of
// an empty room. Never stores the simulation crowd, so the log stays authentic.

const KEY = "mb-chat-log";
const CAP = 240;

function dedupeSort(msgs: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const m of msgs) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Cap the buffer without letting the busiest room crowd out the rarer ones.
 * During a live show Twitch is a firehose and would otherwise evict every Kick /
 * X / YouTube / HQ message from the 220-cap — so keep all of those, then
 * backfill the remaining room with the most recent Twitch chat.
 */
export function capPreservingPlatforms(msgs: ChatMessage[], cap = CAP): ChatMessage[] {
  if (msgs.length <= cap) return dedupeSort(msgs);
  const sorted = dedupeSort(msgs);
  const others = sorted.filter((m) => m.platform !== "twitch");
  const twitch = sorted.filter((m) => m.platform === "twitch");
  if (others.length >= cap) return others.slice(-cap);
  return dedupeSort([...others, ...twitch.slice(-(cap - others.length))]);
}

export function loadChatLog(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : null;
    return Array.isArray(data) ? (data as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export function saveChatLog(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    // Merge with the existing log so the rarer platforms accumulate over the
    // session instead of being evicted from the live buffer by the Twitch
    // firehose between saves.
    const merged = capPreservingPlatforms([...loadChatLog(), ...messages]);
    window.localStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    /* quota / serialization — the log is best-effort, never fatal */
  }
}
