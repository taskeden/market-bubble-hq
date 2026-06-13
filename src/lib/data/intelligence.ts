import type {
  ChatMessage,
  CommunityUser,
  Sentiment,
  TrendingStock,
  TrendingTopic,
} from "../types";
import { TICKERS, TRENDING_TOPIC_POOL } from "./lexicon";

// ─── Community Intelligence ──────────────────────────────────────────────────
// Pure aggregations over the live message buffer, plus a lightweight session
// "market" so the trending-stocks widget shows believable prices + sparklines.

interface TickerState {
  price: number;
  base: number;
  history: number[];
}

const market = new Map<string, TickerState>();
(function seedMarket() {
  for (const { ticker } of TICKERS) {
    const base = 20 + Math.abs(hash(ticker)) * 480;
    market.set(ticker, {
      price: base,
      base,
      history: Array.from({ length: 24 }, () => base * (0.97 + Math.random() * 0.06)),
    });
  }
})();

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return (h % 1000) / 1000;
}

/** Advance the session market by one tick, nudged by community sentiment. */
export function tickMarket(sentimentBias: number) {
  market.forEach((s) => {
    const drift = sentimentBias * 0.0015;
    const noise = (Math.random() - 0.5) * 0.012;
    s.price = Math.max(0.5, s.price * (1 + drift + noise));
    s.history.push(s.price);
    if (s.history.length > 32) s.history.shift();
  });
}

function dominantSentiment(msgs: ChatMessage[]): Sentiment {
  let b = 0,
    r = 0;
  for (const m of msgs) {
    if (m.sentiment === "bullish") b++;
    else if (m.sentiment === "bearish") r++;
  }
  if (b === r) return "neutral";
  return b > r ? "bullish" : "bearish";
}

// ── Lived-in baselines ───────────────────────────────────────────────────────
// In LIVE mode the chat buffer starts empty (and stays empty between streams),
// so the mention-derived widgets would otherwise read as broken. These seed a
// believable, deterministic baseline off the same session market so Our Radar +
// Trending Stocks always show content; real chat mentions override them the
// moment they flow. (The CHAT FEED itself stays pure — this is intelligence,
// like the seeded market tape + viewer counts.)
const BASELINE_TICKERS = [
  "NVDA", "BTC", "TSLA", "ETH", "SOL", "AAPL", "AMD", "COIN", "PLTR", "MSTR", "HOOD", "SPY",
];

function baselineStocks(limit: number): TrendingStock[] {
  const rows: TrendingStock[] = [];
  for (const ticker of BASELINE_TICKERS) {
    const state = market.get(ticker);
    const meta = TICKERS.find((x) => x.ticker === ticker);
    if (!state || !meta) continue;
    rows.push({
      ticker,
      name: meta.name,
      mentions: 38 + Math.round(Math.abs(hash(ticker)) * 210), // stable, organic-looking
      change: ((state.price - state.base) / state.base) * 100, // live: market keeps ticking
      sentiment: state.price >= state.base ? "bullish" : "bearish",
      sparkline: state.history.slice(-16),
    });
  }
  return rows.sort((a, b) => b.mentions - a.mentions).slice(0, limit);
}

function baselineTopics(limit: number): TrendingTopic[] {
  return TRENDING_TOPIC_POOL.map((label) => {
    const h = Math.abs(hash(label));
    return {
      id: label,
      label,
      mentions: 26 + Math.round(h * 170),
      velocity: 6 + Math.round(h * 58), // positive momentum (Radar = fastest growing)
      sentiment: "bullish" as Sentiment,
    };
  })
    .sort((a, b) => b.velocity - a.velocity)
    .slice(0, limit);
}

/** Full market snapshot for the scrolling ticker tape (all tracked symbols). */
export function marketSnapshot(): {
  ticker: string;
  name: string;
  price: number;
  change: number;
}[] {
  const out: { ticker: string; name: string; price: number; change: number }[] = [];
  market.forEach((s, ticker) => {
    const meta = TICKERS.find((t) => t.ticker === ticker);
    out.push({
      ticker,
      name: meta?.name ?? ticker,
      price: s.price,
      change: ((s.price - s.base) / s.base) * 100,
    });
  });
  return out;
}

/** Market snapshot for a fixed set of tickers (Our Radar's pinned watchlist). */
export function watchlistSnapshot(tickers: string[]): {
  ticker: string;
  name: string;
  change: number;
  sparkline: number[];
}[] {
  return tickers.map((ticker) => {
    const state = market.get(ticker);
    const meta = TICKERS.find((t) => t.ticker === ticker);
    return {
      ticker,
      name: meta?.name ?? ticker,
      change: state ? ((state.price - state.base) / state.base) * 100 : 0,
      sparkline: state ? state.history.slice(-16) : [],
    };
  });
}

/** Trending stocks ranked by mentions in the buffer. */
export function computeTrendingStocks(messages: ChatMessage[], limit = 6): TrendingStock[] {
  const live = new Map<string, ChatMessage[]>();
  for (const m of messages) {
    for (const t of m.tickers) {
      if (!live.has(t)) live.set(t, []);
      live.get(t)!.push(m);
    }
  }

  // Build on the lived-in baseline so the board is always full — in live mode
  // the real chat is mostly banter and names few tickers, which would otherwise
  // leave it nearly empty. Live mentions BOOST a ticker's standing and set its
  // sentiment, so genuine community interest still rises to the top.
  const board = new Map<string, TrendingStock>();
  for (const r of baselineStocks(BASELINE_TICKERS.length)) board.set(r.ticker, { ...r });

  live.forEach((msgs, ticker) => {
    const state = market.get(ticker);
    const meta = TICKERS.find((x) => x.ticker === ticker);
    if (!state || !meta) return;
    const boost = msgs.length * 70; // a single real mention meaningfully lifts a name
    const existing = board.get(ticker);
    if (existing) {
      existing.mentions += boost;
      existing.sentiment = dominantSentiment(msgs);
    } else {
      board.set(ticker, {
        ticker,
        name: meta.name,
        mentions: 160 + boost,
        change: ((state.price - state.base) / state.base) * 100,
        sentiment: dominantSentiment(msgs),
        sparkline: state.history.slice(-16),
      });
    }
  });

  return [...board.values()].sort((a, b) => b.mentions - a.mentions).slice(0, limit);
}

/** Trending discussion topics — tickers + macro keywords, with velocity. */
export function computeTrendingTopics(
  messages: ChatMessage[],
  prevCounts?: Map<string, number>,
  limit = 5
): { topics: TrendingTopic[]; counts: Map<string, number> } {
  const counts = new Map<string, number>();
  const sentiments = new Map<string, ChatMessage[]>();

  for (const m of messages) {
    for (const t of m.tickers) {
      const key = `$${t}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      if (!sentiments.has(key)) sentiments.set(key, []);
      sentiments.get(key)!.push(m);
    }
    const text = m.content.toLowerCase();
    for (const topic of TRENDING_TOPIC_POOL) {
      const probe = topic.split(" ")[0].toLowerCase();
      if (text.includes(probe)) {
        counts.set(topic, (counts.get(topic) ?? 0) + 1);
        if (!sentiments.has(topic)) sentiments.set(topic, []);
        sentiments.get(topic)!.push(m);
      }
    }
  }

  const topics: TrendingTopic[] = [...counts.entries()]
    .map(([label, mentions]) => {
      const prev = prevCounts?.get(label) ?? Math.max(1, mentions - 2);
      const velocity = Math.round(((mentions - prev) / prev) * 100);
      return {
        id: label,
        label,
        mentions,
        velocity,
        sentiment: dominantSentiment(sentiments.get(label) ?? []),
      };
    })
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, limit);

  // Nothing mentioned yet → fall back to the lived-in topic baseline.
  return { topics: topics.length ? topics : baselineTopics(limit), counts };
}

/** Sentiment split across the buffer (percentages 0–100). */
export function computeSentiment(messages: ChatMessage[]) {
  let bull = 0,
    bear = 0,
    neu = 0;
  for (const m of messages) {
    if (m.sentiment === "bullish") bull++;
    else if (m.sentiment === "bearish") bear++;
    else neu++;
  }
  const total = Math.max(1, bull + bear + neu);
  return {
    bullish: Math.round((bull / total) * 100),
    bearish: Math.round((bear / total) * 100),
    neutral: Math.round((neu / total) * 100),
  };
}

/** Most active speakers within the buffer, resolved against the roster. */
export function computeMostActive(
  messages: ChatMessage[],
  resolve: (id: string) => CommunityUser | undefined,
  limit = 5
): { user: CommunityUser; count: number }[] {
  const counts = new Map<string, number>();
  for (const m of messages) {
    if (m.kind !== "chat") continue;
    counts.set(m.userId, (counts.get(m.userId) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ user: resolve(id), count }))
    .filter((r): r is { user: CommunityUser; count: number } => Boolean(r.user))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
