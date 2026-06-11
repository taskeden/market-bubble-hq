import type { HostId, Sentiment } from "../types";

// ─── Market Bubble flavored content ──────────────────────────────────────────
// Everything the simulation engine draws on to produce a believable, lively
// trading-community chat. Tuned to feel like a real ticker-watching crowd.

export const TICKERS: { ticker: string; name: string }[] = [
  { ticker: "NVDA", name: "NVIDIA" },
  { ticker: "TSLA", name: "Tesla" },
  { ticker: "AAPL", name: "Apple" },
  { ticker: "SPY", name: "S&P 500 ETF" },
  { ticker: "QQQ", name: "Nasdaq 100 ETF" },
  { ticker: "AMD", name: "Advanced Micro Devices" },
  { ticker: "PLTR", name: "Palantir" },
  { ticker: "GME", name: "GameStop" },
  { ticker: "META", name: "Meta Platforms" },
  { ticker: "MSFT", name: "Microsoft" },
  { ticker: "AMZN", name: "Amazon" },
  { ticker: "COIN", name: "Coinbase" },
  { ticker: "HOOD", name: "Robinhood" },
  { ticker: "SOFI", name: "SoFi" },
  { ticker: "BTC", name: "Bitcoin" },
  { ticker: "ETH", name: "Ethereum" },
  { ticker: "SOL", name: "Solana" },
  { ticker: "MSTR", name: "MicroStrategy" },
  { ticker: "RIVN", name: "Rivian" },
  { ticker: "SMCI", name: "Super Micro" },
  { ticker: "HYPE", name: "Hyperliquid" },
  { ticker: "TTWO", name: "Take-Two" },
  { ticker: "ZEC", name: "Zcash" },
  { ticker: "VVV", name: "Venice AI" },
];

export const TOPICS = [
  "the Fed",
  "CPI print",
  "earnings season",
  "rate cuts",
  "0DTE options",
  "the open",
  "premarket",
  "after hours",
  "the breakout",
  "support levels",
  "the macro picture",
  "liquidity",
  "the squeeze",
  "AI capex",
  "the VIX",
  "the bond market",
];

/** Bullish message templates. {T} = ticker, {TOPIC} = topic. */
const BULLISH: string[] = [
  "{T} breaking out of the range, this is the move 🚀",
  "loading more {T} calls right here",
  "told yall {T} was coiling, here we go",
  "{T} to the moon, who's with me 🫧",
  "this {T} dip is a gift, buying",
  "green day incoming, {T} leading",
  "{T} reclaiming the level, bullish af",
  "volume coming in on {T} 👀",
  "sentiment flipping fast on {TOPIC}",
  "calls printing on {T} lets gooo",
  "{T} just took out resistance like it was nothing",
  "adding to my {T} bag, conviction high",
  "the bubble pumps again 🫧 {T} ripping",
  "{T} setup is textbook, target up 8%",
  "buyers stepping in hard on {T}",
  "macro turning, {TOPIC} is the catalyst",
  "{T} higher low confirmed, send it",
];

const BEARISH: string[] = [
  "{T} rejecting hard at resistance, careful up here",
  "this {T} pump is a trap imo",
  "puts on {T} looking juicy",
  "{TOPIC} gonna nuke this market",
  "{T} losing the level, watch below",
  "selling my {T} into this rip",
  "no way {T} holds these gains",
  "{T} bearish divergence on the 15m",
  "fading this {T} bounce",
  "the bubble is overheating 🫧 {T} due for a pullback",
  "{T} bagholders in shambles rn",
  "distribution all over {T}, be careful",
  "{TOPIC} risk is being ignored here",
  "{T} death cross incoming",
];

const NEUTRAL: string[] = [
  "what's everyone watching on {T} today?",
  "anyone got a level on {T}?",
  "{T} just chopping sideways smh",
  "waiting for {TOPIC} before i do anything",
  "is {T} a buy here or nah",
  "what's the play on {T}",
  "{T} consolidating, patience",
  "holding {T} flat, no edge today",
  "someone explain {TOPIC} to me lol",
  "first time in the bubble, what do i watch?",
  "gm everyone 🫧 ready for the open",
  "this community is unreal honestly",
  "the HQ feed is so much better than 5 tabs open",
  "love watching with you all instead of alone",
  "{T} chart looks like a heartbeat today",
  "remind me why i trade {T} again 😂",
  "Bubbles what do you think about {T}?",
  "hey Bubbles can you summarize what i missed?",
  "Bubbles is the {TOPIC} bullish or bearish rn?",
];

/** Audience questions — steady supply for the terminal's Top Questions panel.
    {HOST} = the host whose room the message lands in. */
const QUESTIONS: string[] = [
  "what's the play on {T} here?",
  "{HOST} are you still long {T}?",
  "anyone have a level on {T}?",
  "is {TOPIC} priced in yet?",
  "Banks what's your stop on {T}?",
  "Ansem thoughts on {T} into the close?",
  "should i take profits on {T} or let it ride?",
  "{HOST} what's your read on {TOPIC}?",
  "wen {T} breakout?",
  "does {TOPIC} change the thesis on {T}?",
  "can someone explain the {T} setup?",
  "{HOST} would you buy {T} at this level?",
  "how are we sizing {T} into earnings?",
  "is anyone else watching {T} volume right now?",
];

const HYPE: string[] = [
  "LETS GOOO 🫧🫧🫧",
  "this stream is fire today 🔥",
  "best community in finance fr",
  "Noah cooking on stream rn",
  "chat is moving so fast lol",
  "🫧🫧🫧",
  "W stream",
  "the energy in here today 🚀",
  "marketbubble nation stand up",
  "GG everyone what a session",
];

export const EMOTES = ["🫧", "🚀", "📈", "📉", "💎", "🐂", "🐻", "🔥", "👀", "💰", "🌊", "⚡"];

// ── Host tweets ───────────────────────────────────────────────────────────────
// The hosts' own X posts, dropped inline in the unified feed as longer-form
// "tweet" cards. Each voice is distinct: Ansem = macro/crypto conviction takes,
// Banks = trading & markets, Market Bubble = the show's editorial desk. {T} =
// ticker, {TOPIC} = macro topic. Tweets read fully formed even un-substituted.
export const HOST_TWEETS: Record<HostId, string[]> = {
  ansem: [
    "CPI reading tomorrow, first FOMC & dot plots next week, stocks up near infinite with very little pullback so far + summer seasonality all hitting at once would make sense for some derisking & basing out over the next few months imo",
    "{T} genuinely looks like a do or die spot here, reclaim and it runs, lose it and we revisit the range lows. not complicated",
    "everyone bearish into {TOPIC} is exactly why it grinds higher. pain trade is up",
    "still my highest conviction hold. {T} accumulation down here will look obvious in 6 months",
    "the amount of liquidity coming back into the system is not priced in yet. stay long, trim into strength",
    "{T} chart is one of the cleanest setups on the board rn, just needs volume to confirm",
    "not financial advice but i am not selling a single coin before {TOPIC} plays out",
  ],
  banks: [
    "took partial profits on {T} into this rip, runners stay on with a stop at break even. never marry a position",
    "if {T} loses this level on the daily close i'm flat and waiting. process over feelings every time",
    "watching {T} and {TOPIC} into the open — this is the trade of the week if it triggers",
    "reminder: you do not have to be in every move. cash is a position. {T} can wait",
    "{T} setup is textbook, risking 1R to make 4. that's the only kind of trade i take",
    "market's giving everyone a second chance at {T} down here, i'm not fading it",
  ],
  marketbubble: [
    "🫧 MARKET BUBBLE is LIVE — Ansem & Banks breaking down {T}, {TOPIC} and the whole tape. pull up: link in bio",
    "today on the show: the {TOPIC} setup, why {T} is every trader's chart of the week, and your questions answered live",
    "the unified chat is going crazy on {T} right now — drop your take, we're reading the best ones on stream 🫧",
    "$10K Vibe Code Challenge is still open — build the unified chat aggregator, deadline this week. let's see what you've got",
    "reminder this is informational & entertainment only, not financial advice. now let's get into {T} 🫧",
  ],
};

/** All template buckets keyed by the sentiment they convey. */
export const TEMPLATES: Record<Sentiment, string[]> = {
  bullish: BULLISH,
  bearish: BEARISH,
  neutral: [...NEUTRAL, ...QUESTIONS, ...HYPE],
};

/** Topic labels used for the trending-topics widget. */
export const TRENDING_TOPIC_POOL = [
  "Fed decision",
  "NVDA earnings",
  "0DTE plays",
  "AI capex",
  "Bitcoin ETF",
  "CPI reaction",
  "Tesla delivery numbers",
  "Rate cut odds",
  "Small caps rotation",
  "Options flow",
  "Gold breakout",
  "Yields spiking",
];

// ── Username generators, styled per platform so the feed feels heterogeneous ──

const ADJ = [
  "Diamond", "Turbo", "Quantum", "Midnight", "Golden", "Crimson", "Silent",
  "Atomic", "Neon", "Lunar", "Vapor", "Hyper", "Cosmic", "Iron", "Solar",
  "Velvet", "Electric", "Frozen", "Rogue", "Stellar",
];
const NOUN = [
  "Trader", "Bull", "Bear", "Whale", "Ape", "Capital", "Macro", "Alpha",
  "Degen", "Hodler", "Quant", "Sniper", "Pilot", "Wizard", "Falcon", "Wolf",
  "Tycoon", "Maverick", "Oracle", "Titan",
];
const HANDLE_WORDS = [
  "fintwit", "charts", "calls", "flow", "macro", "options", "swing", "scalp",
  "alpha", "bubble", "ticker", "candles", "liquidity", "gamma", "vega",
];

export function makeTwitchName(seed: number): string {
  const a = ADJ[seed % ADJ.length];
  const n = NOUN[(seed * 7) % NOUN.length];
  const num = (seed * 13) % 100;
  return `${a}${n}${num > 50 ? num : ""}`;
}

export function makeKickName(seed: number): string {
  const n = NOUN[(seed * 3) % NOUN.length].toLowerCase();
  const w = HANDLE_WORDS[(seed * 5) % HANDLE_WORDS.length];
  return `${n}_${w}${(seed % 9) + 1}`;
}

export function makeXName(seed: number): { handle: string; display: string } {
  const a = ADJ[(seed * 2) % ADJ.length];
  const n = NOUN[(seed * 11) % NOUN.length];
  const w = HANDLE_WORDS[(seed * 4) % HANDLE_WORDS.length];
  return { display: `${a} ${n}`, handle: `${w}${a}`.toLowerCase() };
}

export function makeHQName(seed: number): string {
  const a = ADJ[(seed * 6) % ADJ.length];
  const n = NOUN[(seed * 9) % NOUN.length];
  return `${a}${n}`;
}

export function makeYouTubeName(seed: number): string {
  const a = ADJ[(seed * 8) % ADJ.length];
  const n = NOUN[(seed * 5) % NOUN.length];
  const num = (seed * 17) % 100;
  return seed % 3 === 0 ? `${a}${n}TV` : `${n}Clips${num > 40 ? num : ""}`;
}

/** Detect $TICKERS present in some text (used for live intelligence). */
export function extractTickers(text: string): string[] {
  const found = new Set<string>();
  for (const { ticker } of TICKERS) {
    if (new RegExp(`\\b${ticker}\\b`, "i").test(text)) found.add(ticker);
  }
  return [...found];
}
