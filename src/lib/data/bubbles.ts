import type {
  BubblesInsight,
  ChatMessage,
  Poll,
  TrendingStock,
  TrendingTopic,
} from "../types";
import { pick, uid } from "../utils";

// ─── Bubbles — the AI community co-host ──────────────────────────────────────
// A polished, persona-driven intelligence layer. When ANTHROPIC_API_KEY is set
// these prompts can be routed to Claude via /api/bubbles for richer output; the
// local heuristic engine below keeps Bubbles fully responsive with zero config.

export const BUBBLES = {
  name: "Bubbles",
  handle: "bubbles",
  tagline: "AI Community Co-Host",
};

const GREETINGS = [
  "Welcome to the HQ, {u}! 🫧 Grab a seat — the bubble's just getting started.",
  "{u} just joined the headquarters. Say hey, everyone! 🫧",
  "Fresh face in the bubble — welcome aboard, {u}! Tell us what you're watching.",
  "{u} is in the building. The community grows. 🫧",
];

export function welcome(username: string): BubblesInsight {
  return {
    id: uid("bub"),
    type: "welcome",
    title: "New member welcomed",
    body: pick(GREETINGS).replace("{u}", username),
    timestamp: Date.now(),
  };
}

export function summarize(messages: ChatMessage[]): BubblesInsight {
  const recent = messages.slice(-40);
  const tickerCount = new Map<string, number>();
  for (const m of recent) for (const t of m.tickers) tickerCount.set(t, (tickerCount.get(t) ?? 0) + 1);
  const top = [...tickerCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => `$${x[0]}`);
  const bull = recent.filter((m) => m.sentiment === "bullish").length;
  const bear = recent.filter((m) => m.sentiment === "bearish").length;
  const lean = bull > bear ? "leaning bullish" : bear > bull ? "leaning bearish" : "split down the middle";

  const body = top.length
    ? `Last few minutes the room's been locked on ${top.join(", ")} — chat is ${lean}. ${
        bull > bear
          ? "Energy is high, lots of conviction in the calls."
          : bear > bull
            ? "Some caution creeping in near resistance."
            : "Healthy debate on both sides."
      } 🫧`
    : `It's a calmer stretch in the HQ — good moment to ask the community what they're eyeing next. 🫧`;

  return { id: uid("bub"), type: "summary", title: "Conversation summary", body, timestamp: Date.now() };
}

export function sentimentReadout(s: {
  bullish: number;
  bearish: number;
  neutral: number;
}): BubblesInsight {
  const lead = s.bullish >= s.bearish ? "bullish" : "bearish";
  const body = `Community sentiment is **${s.bullish}% bullish / ${s.bearish}% bearish**. The bubble is tilting ${lead} right now${
    Math.abs(s.bullish - s.bearish) > 25 ? " — pretty decisively." : ", but it's close."
  } 🫧`;
  return {
    id: uid("bub"),
    type: "sentiment",
    title: "Sentiment pulse",
    body,
    timestamp: Date.now(),
    accent: lead === "bullish" ? "bullish" : "bearish",
  };
}

export function trendingCallout(topics: TrendingTopic[]): BubblesInsight {
  const top = topics.slice(0, 3);
  const body = top.length
    ? `Trending in the HQ right now: ${top
        .map((t) => `**${t.label}**${t.velocity > 0 ? ` (+${t.velocity}%)` : ""}`)
        .join(" · ")}. The conversation's moving fast. 🫧`
    : "Things are quiet — perfect time to start a conversation. What's on your radar? 🫧";
  return { id: uid("bub"), type: "trending", title: "Trending topics", body, timestamp: Date.now() };
}

export function highlightMessage(messages: ChatMessage[]): BubblesInsight | null {
  const candidates = messages
    .slice(-30)
    .filter((m) => m.kind === "chat" && (m.tickers.length > 0 || (m.reactions ?? 0) > 5));
  if (!candidates.length) return null;
  const chosen = pick(candidates);
  return {
    id: uid("bub"),
    type: "highlight",
    title: "Highlighted by Bubbles",
    body: `Worth a look — **${chosen.displayName}** said: "${chosen.content}"`,
    timestamp: Date.now(),
    refs: [chosen.id],
    accent: chosen.sentiment,
  };
}

const POLL_TEMPLATES: { q: (t: string) => string }[] = [
  { q: (t) => `Where's ${t} headed into the close?` },
  { q: (t) => `${t} right now — are you buying or fading?` },
  { q: (t) => `Conviction check: how bullish are you on ${t}?` },
];

export function generatePoll(stocks: TrendingStock[]): BubblesInsight {
  const focus = stocks[0]?.ticker ? `$${stocks[0].ticker}` : "the market";
  const tmpl = pick(POLL_TEMPLATES);
  const poll: Poll = {
    id: uid("poll"),
    question: tmpl.q(focus),
    options: [
      { id: "a", label: "🚀 Higher", votes: Math.floor(Math.random() * 40) + 10 },
      { id: "b", label: "⚖️ Chop / flat", votes: Math.floor(Math.random() * 25) + 5 },
      { id: "c", label: "📉 Lower", votes: Math.floor(Math.random() * 30) + 8 },
    ],
    createdBy: "bubbles",
    createdAt: Date.now(),
    closesAt: Date.now() + 5 * 60_000,
    closed: false,
    totalVotes: 0,
  };
  poll.totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
  return {
    id: uid("bub"),
    type: "poll",
    title: "Community poll",
    body: `I just opened a quick poll on ${focus}. Cast your vote 👇 🫧`,
    timestamp: Date.now(),
    poll,
  };
}

export function recap(stats: {
  totalMessages: number;
  currentViewers: number;
  peakViewers: number;
}): BubblesInsight {
  return {
    id: uid("bub"),
    type: "recap",
    title: "Session recap",
    body: `What a session 🫧 — **${stats.totalMessages.toLocaleString()} messages** across the community, peaking at **${stats.peakViewers.toLocaleString()} viewers**. The HQ was buzzing. See you next stream!`,
    timestamp: Date.now(),
  };
}

/** Heuristic answer to a member's question directed at Bubbles. */
export function answer(question: string, stocks: TrendingStock[]): BubblesInsight {
  const q = question.toLowerCase();
  let body: string;

  const mentioned = stocks.find((s) => q.includes(s.ticker.toLowerCase()));
  if (q.includes("summar") || q.includes("miss") || q.includes("catch")) {
    body = "Here's the gist: the room's been active on the top tickers, sentiment's shifting in real time, and the energy is high. I'll keep dropping summaries as things move. 🫧";
  } else if (mentioned) {
    const dir = mentioned.change >= 0 ? "up" : "down";
    body = `$${mentioned.ticker} is **${dir} ${Math.abs(mentioned.change).toFixed(1)}%** this session and it's one of the most-talked-about names in the HQ right now — chat is ${mentioned.sentiment}. Not financial advice, just the community pulse. 🫧`;
  } else if (q.includes("bull") || q.includes("bear") || q.includes("sentiment")) {
    body = "Right now the community's split, but momentum matters — watch the trending panel on the right, it updates live as the mood shifts. 🫧";
  } else {
    body = "Great question — I'm reading the room continuously. Drop a $TICKER and I'll tell you how the community feels about it. 🫧";
  }

  return { id: uid("bub"), type: "answer", title: "Bubbles answered", body, timestamp: Date.now() };
}
