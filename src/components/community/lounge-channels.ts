import type { ChatMessage, CommunityUser } from "@/lib/types";
import { craftMessage } from "@/lib/data/engine";
import { EMOTES, extractTickers, TICKERS } from "@/lib/data/lexicon";
import { getRoster } from "@/lib/data/roster";
import { pick } from "@/lib/utils";

// ─── The lounge's Discord-style channels ──────────────────────────────────────
// Real topic channels (general / memes / stocks / crypto / nfts) + a voice
// channel — NOT platform filters. Each text channel has its own flavored bot
// chatter so the room reads like a living community, not one finance firehose.

export type ChannelKind = "text" | "voice";

export interface LoungeChannel {
  id: string;
  name: string;
  kind: ChannelKind;
  topic: string;
  /** Channel-intro blurb under the welcome headline. */
  welcome: string;
  /** Optional red marker-hand flourish on the welcome block. */
  hand?: string;
}

export const CHANNELS: LoungeChannel[] = [
  {
    id: "general",
    name: "general",
    kind: "text",
    topic: "Just hanging out — gm, good vibes and whatever's on your mind.",
    welcome:
      "The heart of the hangout. Say gm, talk your book, or just lurk with the crew. Everyone's welcome here.",
    hand: "pull up a chair — the floor is open.",
  },
  {
    id: "memes",
    name: "memes",
    kind: "text",
    topic: "Charts as comedy. Post your Ls, your rockets and your cope.",
    welcome: "Where the trading pain becomes content. Keep it funny, keep it bullish-ish. 🫧",
    hand: "down bad, vibing harder.",
  },
  {
    id: "stocks",
    name: "stocks",
    kind: "text",
    topic: "Equities, earnings & options flow — $NVDA $TSLA $SPY and friends.",
    welcome: "Tickers, levels and setups. Share the play, share the risk. Not financial advice.",
  },
  {
    id: "crypto",
    name: "crypto",
    kind: "text",
    topic: "BTC, ETH, SOL and the whole degen tape.",
    welcome: "On-chain, off the rails. Majors, alts, funding and the next leg. Ser, you're early.",
  },
  {
    id: "nfts",
    name: "nfts",
    kind: "text",
    topic: "Floors, mints, blue chips and your pfp flexes.",
    welcome: "Jpegs with conviction. Floor talk, mint alpha and the art that hits different.",
  },
  {
    id: "ai",
    name: "ai",
    kind: "text",
    topic: "Models, compute, agents & the AI capex trade.",
    welcome: "Where the AI capex thesis lives. Models, GPUs, agents and the names riding it.",
  },
  {
    id: "voice-chat",
    name: "voice-chat",
    kind: "voice",
    topic: "Hop in and talk markets live with the crew.",
    welcome: "",
  },
];

export const TEXT_CHANNEL_IDS = CHANNELS.filter((c) => c.kind === "text").map((c) => c.id);
export const DEFAULT_CHANNEL = "general";

export function channelById(id: string): LoungeChannel {
  return CHANNELS.find((c) => c.id === id) ?? CHANNELS[0];
}

// ── Per-channel phrase pools — {T}=stock ticker, {C}=crypto ticker ────────────

const CHANNEL_PHRASES: Record<string, string[]> = {
  general: [
    "gm everyone 🫧",
    "how's the morning treating you all",
    "honestly the best part of my day is this chat",
    "just got off work, what'd i miss today",
    "anyone else just here for the vibes ngl",
    "the bubble never sleeps lol",
    "coffee + market bubble = perfect open",
    "first time chatting here, hi all 👋",
    "what timezone is everyone trading from? curious",
    "Bubbles you around? got a question",
    "this community is unreal honestly",
    "wholesome chat today, love to see it",
    "watching the open with you all > watching alone",
    "back from lunch, how we looking",
    "shoutout to the mods keeping it clean in here",
    "new here, this place is way better than 5 tabs open",
  ],
  memes: [
    "ser the chart is speaking to me 📈",
    "it's so over 😭",
    "we're so back 🚀",
    "buy high sell low, my one weird trick",
    "my portfolio is a comedy show at this point 🤡",
    "wen lambo ser",
    "down bad but vibing 💀",
    "chart looks like my heart rate fr",
    "gm to everyone except my puts",
    "this is financial advice (it's not) 🫧",
    "ngmi energy in here today lmao",
    "diamond hands 💎🙌 all the way to zero",
    "stop loss? i only know stop profit 😎",
    "the memes are the only thing green today",
    "bought the top again, im so good at this 🫠",
    "{C} did WHAT overnight 💀",
  ],
  stocks: [
    "{T} setup looking clean on the daily",
    "anyone watching {T} into earnings tonight?",
    "{T} held the level, im long here",
    "{T} flow is absolutely insane today 👀",
    "0DTE on {T} printing rn",
    "rotating out of tech into {T}",
    "{T} guidance was a beat, sending it",
    "what's the {T} target for this week",
    "{T} broke resistance, gap fill next imo",
    "watching {T} and {T} for a pairs trade",
    "{T} earnings reaction makes no sense lol",
    "loaded {T} calls on that dip",
    "{T} volume drying up, careful chasing",
    "anyone got a clean level on {T}?",
  ],
  crypto: [
    "{C} reclaiming the level, bullish af",
    "on-chain data for {C} looking strong",
    "{C} dominance creeping up again 👀",
    "staking my {C} and touching grass",
    "{C} just liquidated all the shorts lol",
    "alt season WEN ser",
    "{C} new ATH this cycle, calling it now",
    "funding flipped negative on {C}, squeeze setup",
    "DCA into {C} every dip, simple as",
    "{C} / {C} ratio about to send imo",
    "{C} holders we are so back 🚀",
    "ETF inflows into {C} not slowing down",
    "{C} looks coiled, big move loading",
    "still my highest conviction {C} bag",
  ],
  nfts: [
    "floor's holding surprisingly well today",
    "just minted, wish me luck 🤞",
    "blue chips bleeding but the art still fire",
    "my pfp is my whole personality at this point",
    "anyone aping the new mint tonight?",
    "paper handed my way to financial ruin 💀",
    "the doodle hits different ngl",
    "gm to my fellow jpeg enjoyers 🫧",
    "floor swept, wagmi frens",
    "holding my punk till i die",
    "this collection's community is actually elite",
    "minting now, gas is brutal tho",
    "rare traits pumping the floor again",
    "art > flips, but the flips are nice too 😅",
  ],
  ai: [
    "{T} riding the whole AI capex wave again",
    "new model dropped and it's actually insane",
    "compute is the new oil, simple as",
    "{T} datacenter buildout is straight up parabolic",
    "agents are gonna eat every saas tbh",
    "anyone running models locally? what rig you on",
    "the AI capex numbers this quarter are unreal",
    "GPUs sold out again, {T} eating 🚀",
    "is this an AI bubble or are we just early 👀",
    "open source models catching up scary fast",
    "inference costs falling off a cliff, bullish the apps",
    "Bubbles is genuinely my favorite AI ngl 🫧",
    "every earnings call says AI 47 times now lol",
    "robotics is the next leg after the LLMs imo",
    "the benchmarks are getting silly good every week",
    "{T} guidance all about AI demand again, shocker",
  ],
};

const STOCK_TICKERS = TICKERS.filter(
  (t) => !["BTC", "ETH", "SOL", "COIN", "MSTR"].includes(t.ticker)
).map((t) => t.ticker);
const CRYPTO_TICKERS = ["BTC", "ETH", "SOL", "COIN", "MSTR"];

/** Craft a believable message FOR a given channel: real roster identity from
    the engine, channel-flavored content. */
export function craftChannelMessage(channelId: string, ts = Date.now()): ChatMessage {
  const base = craftMessage(ts);
  const pool = CHANNEL_PHRASES[channelId] ?? CHANNEL_PHRASES.general;
  let content = pick(pool)
    .replaceAll("{T}", () => `$${pick(STOCK_TICKERS)}`)
    .replaceAll("{C}", () => `$${pick(CRYPTO_TICKERS)}`);
  if (Math.random() > 0.82 && !/\p{Emoji}/u.test(content)) content += ` ${pick(EMOTES)}`;
  return {
    ...base,
    content,
    kind: "chat",
    tickers: extractTickers(content),
    mentionsBubbles: /bubbles/i.test(content),
  };
}

// ── Voice channel participants — a stable handful "sitting in voice" ──────────

export const VOICE_MEMBERS: CommunityUser[] = getRoster()
  .filter((u) => u.online && u.role !== "founder")
  .slice(4, 11);

/** Deterministic muted state so the voice tiles read like a real call. */
export function isMutedInVoice(i: number): boolean {
  return i % 3 === 1;
}
