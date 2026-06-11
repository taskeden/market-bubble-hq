"use client";

import { useEffect, useState } from "react";
import { useHQ } from "@/store/hq-store";
import { watchlistSnapshot } from "@/lib/data/intelligence";
import { Sparkline } from "./sparkline";
import { cn } from "@/lib/utils";

// The hosts' pinned radar — the names on the desk right now, in this order.
// Mention counts hold a stable baseline until the room actually talks about
// one; price action (sparkline + change) rides the live session market.
const WATCHLIST = [
  { ticker: "HYPE", mentions: 23 },
  { ticker: "TTWO", mentions: 17 },
  { ticker: "ZEC", mentions: 31 },
  { ticker: "VVV", mentions: 12 },
  { ticker: "NVDA", mentions: 48 },
];

type Row = ReturnType<typeof watchlistSnapshot>[number];

export function RadarWatchlist() {
  const topics = useHQ((s) => s.trendingTopics);
  const stocks = useHQ((s) => s.trendingStocks);
  const setSearch = useHQ((s) => s.setSearch);

  // Pull market data client-side only (the session market is randomly seeded,
  // so rendering it during SSR would hydrate mismatched), same cadence as the
  // MARKET WATCH tape.
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    const pull = () => setRows(watchlistSnapshot(WATCHLIST.map((w) => w.ticker)));
    pull();
    const id = setInterval(pull, 2200);
    return () => clearInterval(id);
  }, []);

  if (!rows.length) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        Scanning tickers…
      </p>
    );
  }

  return (
    // Only 5 pinned rows next to Trending Stocks' 6 — stretch each row evenly
    // (`flex-1`) so the list fills the matched card height with no dead space.
    <div className="flex h-full flex-col">
      {rows.map((r) => {
        const up = r.change >= 0;
        const live =
          topics.find((t) => t.label === `$${r.ticker}`)?.mentions ??
          stocks.find((s) => s.ticker === r.ticker)?.mentions;
        const mentions =
          live ?? WATCHLIST.find((w) => w.ticker === r.ticker)?.mentions ?? 0;
        return (
          <button
            key={r.ticker}
            onClick={() => setSearch(r.ticker)}
            className="flex w-full flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-black/[0.04]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="tabular text-[15px] font-bold">${r.ticker}</span>
                <span className="rounded bg-black/[0.06] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {mentions}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{r.name}</p>
            </div>
            <Sparkline data={r.sparkline} positive={up} width={72} height={26} />
            <span
              className={cn(
                "tabular w-14 text-right text-[13px] font-semibold",
                up ? "text-emerald-600" : "text-destructive"
              )}
            >
              {up ? "+" : ""}
              {r.change.toFixed(1)}%
            </span>
          </button>
        );
      })}
    </div>
  );
}
