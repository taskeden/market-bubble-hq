import type { ChatMessage, CommunityUser, HostId, Platform, Sentiment } from "../types";
import { extractTickers, HOST_TWEETS, TEMPLATES, TICKERS, TOPICS, EMOTES } from "./lexicon";
import { getRoster } from "./roster";
import { HOSTS, HOST_ORDER, hostForPlatform } from "../config";
import { pick, uid, weightedPick } from "../utils";

// ─── Realtime simulation engine ──────────────────────────────────────────────
// Produces a believable, continuously-streaming Market Bubble chat by drawing
// on the deterministic roster + lexicon. A slowly drifting "mood" makes the
// crowd's sentiment shift over time so the intelligence widgets feel alive.

export interface ChatSource {
  readonly id: string;
  start(emit: (m: ChatMessage) => void): void;
  stop(): void;
  /** Optional: fetch the room's recent real backlog so the feed opens with
      history, not empty. Resolves to [] when no backlog is available. */
  history?(): Promise<ChatMessage[]>;
}

const roster = getRoster();
// Weight active users so a recognizable core does most of the talking.
const speakers = roster.filter((u) => u.role !== "founder");

function weightedSpeaker(): CommunityUser {
  return weightedPick(
    speakers.map((u) => ({
      value: u,
      weight: (u.online ? 2.2 : 0.5) * (0.4 + u.engagementScore / 100),
    }))
  );
}

// Global market mood does a bounded random walk in [-1, 1].
let mood = 0.15;
function stepMood() {
  mood += (Math.random() - 0.48) * 0.12;
  mood = Math.max(-1, Math.min(1, mood));
}

function moodSentiment(): Sentiment {
  const bull = 0.42 + mood * 0.32;
  const bear = 0.3 - mood * 0.28;
  return weightedPick<Sentiment>([
    { value: "bullish", weight: Math.max(0.05, bull) },
    { value: "bearish", weight: Math.max(0.05, bear) },
    { value: "neutral", weight: 0.34 },
  ]);
}

function fillTemplate(template: string, source: HostId): { content: string; sentiment: Sentiment } {
  const ticker = pick(TICKERS).ticker;
  let content = template
    .replaceAll("{T}", `$${ticker}`)
    .replaceAll("{TOPIC}", pick(TOPICS))
    .replaceAll("{HOST}", HOSTS[source].label);
  // Occasionally tack on an emote for texture.
  if (Math.random() > 0.82 && !/\p{Emoji}/u.test(content)) {
    content += ` ${pick(EMOTES)}`;
  }
  return { content, sentiment: "neutral" };
}

/** Craft a single believable message from a random active speaker. */
export function craftMessage(timestamp = Date.now()): ChatMessage {
  const user = weightedSpeaker();
  const platform: Platform = pick(user.platforms);
  const source = hostForPlatform(platform);
  const sentiment = moodSentiment();
  const template = pick(TEMPLATES[sentiment]);
  const { content } = fillTemplate(template, source);
  const tickers = extractTickers(content);
  const mentionsBubbles = /bubbles/i.test(content);

  return {
    id: uid("m"),
    platform,
    source,
    kind: "chat",
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    content,
    timestamp,
    role: user.role,
    tickers,
    sentiment,
    mentionsBubbles,
    reactions: Math.random() > 0.9 ? Math.floor(Math.random() * 24) + 1 : undefined,
  };
}

/** Craft one of the hosts' own X posts — a longer-form "tweet" that drops into
    the unified feed as a card. Authored BY the host (Ansem / Banks / Market
    Bubble), platform X, kind "tweet". */
export function craftHostTweet(timestamp = Date.now(), host: HostId = pick(HOST_ORDER)): ChatMessage {
  const meta = HOSTS[host];
  const template = pick(HOST_TWEETS[host]);
  const ticker = pick(TICKERS).ticker;
  const content = template
    .replaceAll("{T}", `$${ticker}`)
    .replaceAll("{TOPIC}", pick(TOPICS));
  return {
    id: uid("tweet"),
    platform: "x",
    source: host,
    kind: "tweet",
    userId: `host_${host}`,
    username: meta.handle,
    displayName: meta.label,
    content,
    timestamp,
    role: "founder",
    tickers: extractTickers(content),
    sentiment: moodSentiment(),
    mentionsBubbles: /bubbles/i.test(content),
    reactions: Math.floor(Math.random() * 80) + 18,
  };
}

/** Seed the feed with recent history so it never opens empty. A couple of host
    tweets are sprinkled near the recent end so the feature is visible on open. */
export function backfill(count = 28): ChatMessage[] {
  const now = Date.now();
  const out: ChatMessage[] = [];
  for (let i = count; i > 0; i--) {
    stepMood();
    const ts = now - i * (1200 + Math.random() * 2600);
    // Two host tweets land in the recent third of the backfill.
    if (i === Math.round(count * 0.3) || i === Math.round(count * 0.12)) {
      out.push(craftHostTweet(ts));
    } else {
      out.push(craftMessage(ts));
    }
  }
  return out;
}

/** The simulation chat source: emits messages with bursty, organic cadence,
    plus the hosts' own tweets dropping in on a slower beat. */
export class SimulationSource implements ChatSource {
  readonly id = "simulation";
  private timer: ReturnType<typeof setTimeout> | null = null;
  private tweetTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  start(emit: (m: ChatMessage) => void) {
    this.stopped = false;
    const tick = () => {
      if (this.stopped) return;
      stepMood();
      // Burstiness: occasionally fire a flurry (hype moment).
      const burst = Math.random() > 0.86 ? Math.floor(Math.random() * 3) + 2 : 1;
      for (let i = 0; i < burst; i++) {
        setTimeout(() => !this.stopped && emit(craftMessage()), i * 140);
      }
      // Cadence scales with how "hot" the room is (mood magnitude).
      const heat = 0.5 + Math.abs(mood) * 0.7;
      const delay = (650 + Math.random() * 1700) / heat;
      this.timer = setTimeout(tick, delay);
    };
    this.timer = setTimeout(tick, 600);

    // Host tweets land every ~22–42s so they punctuate the chat without flooding.
    const tweetTick = () => {
      if (this.stopped) return;
      emit(craftHostTweet());
      this.tweetTimer = setTimeout(tweetTick, 22_000 + Math.random() * 20_000);
    };
    this.tweetTimer = setTimeout(tweetTick, 9_000 + Math.random() * 8_000);
  }

  stop() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    if (this.tweetTimer) clearTimeout(this.tweetTimer);
    this.timer = null;
    this.tweetTimer = null;
  }
}

/** Current mood, exposed for ambient UI (sentiment gauge bias). */
export function currentMood() {
  return mood;
}
