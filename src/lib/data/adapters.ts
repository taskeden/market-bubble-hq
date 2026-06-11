import type { ChatMessage, HostId, MessageKind, Platform, Sentiment, UserRole } from "../types";
import { extractTickers } from "./lexicon";
import { uid } from "../utils";
import { type ChatSource, SimulationSource } from "./engine";
import { KICK_CHATROOM_ID, SITE, hostForPlatform } from "../config";
import { effectiveDataMode } from "../demo";
import { setSourceStatus } from "./live-status";

// ─── Platform adapters ───────────────────────────────────────────────────────
// Every chat source implements the same `ChatSource` contract. In live mode
// (the default) we connect to the hosts' REAL rooms and the feed only moves
// when actual messages arrive — there is deliberately no simulation fallback.
//
//   twitch  → anonymous IRC-over-WebSocket on #fazebanks (Banks)        [browser]
//   kick    → Pusher WebSocket on Ansem's chatroom                      [browser]
//   youtube → innertube live-chat poll via /api/youtube/chat (CORS)     [server-proxied]
//   x       → /api/x-stream SSE relay; requires X_BEARER_TOKEN          [server-proxied]
//
// Each adapter reports its connection state to the live-status store so the
// Source Matrix shows exactly what's wired up.

/** Lightweight keyword sentiment for live messages (no roster context). */
function classifySentiment(text: string): Sentiment {
  const t = text.toLowerCase();
  const bull = /(moon|calls|breakout|long|buy|bull|pump|green|rip|squeeze|🚀|📈|🐂)/.test(t);
  const bear = /(puts|short|dump|bear|red|crash|sell|rug|nuke|📉|🐻)/.test(t);
  if (bull && !bear) return "bullish";
  if (bear && !bull) return "bearish";
  return "neutral";
}

function liveMessage(
  platform: Platform,
  username: string,
  content: string,
  overrides: Partial<{
    id: string;
    displayName: string;
    role: UserRole;
    source: HostId;
    kind: MessageKind;
    timestamp: number;
  }> = {}
): ChatMessage {
  return {
    id: overrides.id ?? uid("live"),
    platform,
    source: overrides.source ?? hostForPlatform(platform),
    kind: overrides.kind ?? "chat",
    userId: `live_${platform}_${username.toLowerCase()}`,
    username,
    displayName: overrides.displayName ?? username,
    content,
    timestamp: overrides.timestamp ?? Date.now(),
    role: overrides.role ?? "member",
    tickers: extractTickers(content),
    sentiment: classifySentiment(content),
    mentionsBubbles: /bubbles/i.test(content),
  };
}

/** Reconnect helper — exponential backoff capped at 30s. */
function backoffMs(attempt: number) {
  return Math.min(30_000, 1500 * 2 ** attempt);
}

const TWITCH_PRIVMSG = /(?:@([^ ]+) )?:(\w+)!\w+@[\w.]+ PRIVMSG #(\w+) :(.*)/;

function roleFromTwitchBadges(badges: string): UserRole {
  return badges.includes("broadcaster/")
    ? "founder"
    : badges.includes("moderator/")
      ? "mod"
      : badges.includes("vip/")
        ? "vip"
        : "member";
}

/** Parse one raw IRC PRIVMSG line (live or from the history API) into a message.
    Returns the Twitch message id (tags.id) so callers can dedupe across the
    history backfill and the live socket. */
function parseTwitchLine(
  line: string,
  channel: string
): { message: ChatMessage; tagId: string } | null {
  const m = line.match(TWITCH_PRIVMSG);
  if (!m || m[3].toLowerCase() !== channel) return null;
  const tags = Object.fromEntries((m[1] || "").split(";").map((kv) => kv.split("=") as [string, string]));
  const ts = Number(tags["tmi-sent-ts"]);
  const tagId = tags["id"] || `${m[2]}_${tags["tmi-sent-ts"] || ""}`;
  return {
    tagId,
    message: liveMessage("twitch", m[2], m[4], {
      // Stable id from Twitch's own message id so the same message read from
      // the history API and the live socket collapses to one row.
      id: `tw_${tagId}`,
      displayName: tags["display-name"] || m[2],
      role: roleFromTwitchBadges(tags["badges"] || ""),
      timestamp: Number.isFinite(ts) && ts > 0 ? ts : undefined,
    }),
  };
}

/**
 * Twitch — anonymous read over the public IRC-WebSocket gateway (verified live:
 * the same transport tmi.js uses). Tags capability gives us display names and
 * real badge → role mapping. No credentials required.
 */
export class TwitchSource implements ChatSource {
  readonly id = "twitch";
  private ws: WebSocket | null = null;
  private channel: string;
  private stopped = false;
  private attempts = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  /** Twitch message ids already surfaced (history + live), to avoid boundary dupes. */
  private seen = new Set<string>();

  constructor(channel: string) {
    this.channel = channel.toLowerCase();
  }

  /** Recent real chat via robotty's public logger (open CORS, includes
      tmi-sent-ts timestamps + tags). Returns [] if the channel isn't logged. */
  async history(): Promise<ChatMessage[]> {
    try {
      const r = await fetch(
        `https://recent-messages.robotty.de/api/v2/recent-messages/${this.channel}?limit=200`
      );
      if (!r.ok) return [];
      const data = (await r.json()) as { messages?: string[] };
      const out: ChatMessage[] = [];
      for (const line of data.messages ?? []) {
        const parsed = parseTwitchLine(line, this.channel);
        if (parsed && !this.seen.has(parsed.tagId)) {
          this.seen.add(parsed.tagId);
          out.push(parsed.message);
        }
      }
      return out;
    } catch {
      return [];
    }
  }

  start(emit: (m: ChatMessage) => void) {
    this.stopped = false;
    this.connect(emit);
  }

  private connect(emit: (m: ChatMessage) => void) {
    if (this.stopped || typeof WebSocket === "undefined") return;
    setSourceStatus("twitch", "connecting", `Joining #${this.channel}…`);
    const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    this.ws = ws;
    ws.onopen = () => {
      ws.send("CAP REQ :twitch.tv/tags");
      ws.send(`NICK justinfan${Math.floor(Math.random() * 99999)}`);
      ws.send(`JOIN #${this.channel}`);
    };
    ws.onmessage = (ev) => {
      const lines = String(ev.data).split("\r\n");
      for (const line of lines) {
        if (!line) continue;
        if (line.startsWith("PING")) {
          ws.send("PONG :tmi.twitch.tv");
          continue;
        }
        if (line.includes(` JOIN #${this.channel}`)) {
          this.attempts = 0;
          setSourceStatus("twitch", "connected", `In #${this.channel} — messages flow when the room talks`);
          continue;
        }
        const parsed = parseTwitchLine(line, this.channel);
        if (!parsed || this.seen.has(parsed.tagId)) continue;
        this.seen.add(parsed.tagId);
        if (this.seen.size > 1200) this.seen = new Set([...this.seen].slice(-600));
        emit(parsed.message);
      }
    };
    ws.onclose = () => this.scheduleReconnect(emit);
    ws.onerror = () => {
      try {
        ws.close();
      } catch {
        /* already closing */
      }
    };
  }

  private scheduleReconnect(emit: (m: ChatMessage) => void) {
    if (this.stopped) return;
    setSourceStatus("twitch", "error", "Twitch IRC dropped — reconnecting");
    this.retryTimer = setTimeout(() => this.connect(emit), backoffMs(this.attempts++));
  }

  stop() {
    this.stopped = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.ws?.close();
    this.ws = null;
  }
}

/**
 * Kick — Ansem's public chatroom over Kick's Pusher WebSocket (verified live:
 * app key 32cbd69e4b950bf97679, cluster us2, channel `chatrooms.{id}.v2`).
 */
export class KickSource implements ChatSource {
  readonly id = "kick";
  private ws: WebSocket | null = null;
  private chatroomId: string;
  private stopped = false;
  private attempts = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(chatroomId: string) {
    this.chatroomId = chatroomId;
  }

  start(emit: (m: ChatMessage) => void) {
    this.stopped = false;
    this.connect(emit);
  }

  private connect(emit: (m: ChatMessage) => void) {
    if (this.stopped || typeof WebSocket === "undefined" || !this.chatroomId) return;
    setSourceStatus("kick", "connecting", "Subscribing to Ansem's chatroom…");
    const ws = new WebSocket(
      "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0&flash=false"
    );
    this.ws = ws;
    ws.onmessage = (ev) => {
      try {
        const frame = JSON.parse(String(ev.data));
        if (frame.event === "pusher:connection_established") {
          ws.send(
            JSON.stringify({
              event: "pusher:subscribe",
              data: { auth: "", channel: `chatrooms.${this.chatroomId}.v2` },
            })
          );
        } else if (frame.event === "pusher_internal:subscription_succeeded") {
          this.attempts = 0;
          setSourceStatus("kick", "connected", "In Ansem's Kick chatroom — messages flow when the room talks");
        } else if (frame.event === "pusher:ping") {
          ws.send(JSON.stringify({ event: "pusher:pong", data: {} }));
        } else if (frame.event === "App\\Events\\ChatMessageEvent") {
          const payload = JSON.parse(frame.data);
          const sender = payload.sender ?? {};
          const badges: { type?: string }[] = sender.identity?.badges ?? [];
          const role: UserRole = badges.some((b) => b.type === "broadcaster")
            ? "founder"
            : badges.some((b) => b.type === "moderator")
              ? "mod"
              : badges.some((b) => b.type === "vip" || b.type === "og")
                ? "vip"
                : "member";
          // Kick inlines emotes as [emote:12345:name] — render the name.
          const content = String(payload.content ?? "").replace(/\[emote:\d+:([^\]]+)\]/g, "$1");
          if (content.trim()) emit(liveMessage("kick", sender.username ?? "kick_user", content, { role }));
        }
      } catch {
        /* ignore non-JSON frames */
      }
    };
    ws.onclose = () => this.scheduleReconnect(emit);
    ws.onerror = () => {
      try {
        ws.close();
      } catch {
        /* already closing */
      }
    };
  }

  private scheduleReconnect(emit: (m: ChatMessage) => void) {
    if (this.stopped) return;
    setSourceStatus("kick", "error", "Kick socket dropped — reconnecting");
    this.retryTimer = setTimeout(() => this.connect(emit), backoffMs(this.attempts++));
  }

  stop() {
    this.stopped = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.ws?.close();
    this.ws = null;
  }
}

/**
 * YouTube — polls the channel's live state via /api/youtube (the existing
 * detector), and while live, polls /api/youtube/chat (an innertube proxy —
 * youtube.com blocks browser CORS) with a rolling continuation. The first
 * batch is the room's recent real history.
 */
export class YouTubeSource implements ChatSource {
  readonly id = "youtube";
  private stopped = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private seen = new Set<string>();

  start(emit: (m: ChatMessage) => void) {
    this.stopped = false;
    setSourceStatus("youtube", "connecting", "Checking @MarketBubble live state…");
    void this.watchLoop(emit);
  }

  private schedule(fn: () => void, ms: number) {
    if (this.stopped) return;
    this.timer = setTimeout(fn, ms);
  }

  /** Outer loop: is the channel live? (re-checked every 60s while offline) */
  private async watchLoop(emit: (m: ChatMessage) => void) {
    if (this.stopped) return;
    try {
      const r = await fetch("/api/youtube");
      const yt = await r.json();
      if (yt?.live && yt.videoId) {
        setSourceStatus("youtube", "connecting", "Live! Attaching to the chat…");
        void this.chatLoop(emit, yt.videoId, null);
        return;
      }
      setSourceStatus("youtube", "offline", "@MarketBubble isn't live — no live chat exists right now");
    } catch {
      setSourceStatus("youtube", "error", "Couldn't check live state — retrying");
    }
    this.schedule(() => void this.watchLoop(emit), 60_000);
  }

  /** Inner loop: poll live chat with the rolling continuation. */
  private async chatLoop(emit: (m: ChatMessage) => void, videoId: string, continuation: string | null) {
    if (this.stopped) return;
    try {
      const qs = new URLSearchParams({ video: videoId });
      if (continuation) qs.set("continuation", continuation);
      const r = await fetch(`/api/youtube/chat?${qs}`);
      const data = await r.json();
      if (data.disabled) {
        setSourceStatus("youtube", "offline", "Live chat is disabled on this stream");
        this.schedule(() => void this.watchLoop(emit), 120_000);
        return;
      }
      if (!r.ok || data.error) throw new Error(data.error || `HTTP ${r.status}`);
      setSourceStatus("youtube", "connected", "Reading @MarketBubble live chat");
      for (const msg of data.messages ?? []) {
        if (this.seen.has(msg.id)) continue;
        this.seen.add(msg.id);
        emit(
          liveMessage("youtube", msg.author, msg.text, {
            id: `yt_${msg.id}`,
            timestamp: msg.timestamp || Date.now(),
            role: msg.role ?? "member",
          })
        );
      }
      if (this.seen.size > 600) this.seen = new Set([...this.seen].slice(-300));
      if (data.continuation) {
        this.schedule(() => void this.chatLoop(emit, videoId, data.continuation), data.pollMs ?? 3500);
      } else {
        // Stream likely ended — fall back to live-state watching.
        this.schedule(() => void this.watchLoop(emit), 10_000);
      }
    } catch {
      setSourceStatus("youtube", "error", "Live chat poll failed — re-checking stream");
      this.schedule(() => void this.watchLoop(emit), 30_000);
    }
  }

  stop() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}

/**
 * X — the hosts' accounts can only be read through the paid API, so this
 * relays through /api/x-stream (SSE). Without X_BEARER_TOKEN in the server env
 * the source honestly reports "not configured" and stays silent.
 */
export class XSource implements ChatSource {
  readonly id = "x";
  private es: EventSource | null = null;
  private stopped = false;

  start(emit: (m: ChatMessage) => void) {
    this.stopped = false;
    setSourceStatus("x", "connecting", "Checking X relay…");
    void this.init(emit);
  }

  private async init(emit: (m: ChatMessage) => void) {
    if (this.stopped || typeof EventSource === "undefined") return;
    try {
      const probe = await fetch("/api/x-stream?probe=1");
      const { configured } = await probe.json();
      if (!configured) {
        setSourceStatus("x", "unavailable", "Add X_BEARER_TOKEN to .env.local to relay the hosts' X posts");
        return;
      }
    } catch {
      setSourceStatus("x", "error", "X relay unreachable");
      return;
    }
    const es = new EventSource("/api/x-stream");
    this.es = es;
    es.onopen = () => setSourceStatus("x", "connected", "Relaying the hosts' X timelines");
    es.onmessage = (ev) => {
      try {
        const t = JSON.parse(ev.data) as {
          id: string;
          host: HostId;
          user: string;
          display: string;
          text: string;
          timestamp?: number;
        };
        emit(
          liveMessage("x", t.user, t.text, {
            id: `x_${t.id}`,
            displayName: t.display,
            source: t.host,
            kind: "tweet",
            role: "founder",
            timestamp: t.timestamp,
          })
        );
      } catch {
        /* skip malformed frames */
      }
    };
    es.onerror = () => {
      setSourceStatus("x", "error", "X relay dropped — browser will retry");
    };
  }

  stop() {
    this.stopped = true;
    this.es?.close();
    this.es = null;
  }
}

/** Build the active set of chat sources based on the effective data mode.
    Demo mode → the lively simulation crowd; otherwise the real rooms. */
export function createChatSources(): ChatSource[] {
  if (effectiveDataMode() === "live") {
    setSourceStatus("hq", "connected", "HQ native chat");
    // Real rooms only — if nothing is live, the feed simply doesn't move.
    return [
      new TwitchSource(process.env.NEXT_PUBLIC_TWITCH_CHANNEL || SITE.twitch),
      new KickSource(KICK_CHATROOM_ID),
      new YouTubeSource(),
      new XSource(),
    ];
  }
  return [new SimulationSource()];
}
