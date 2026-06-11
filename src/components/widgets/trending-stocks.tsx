"use client";

import { useHQ } from "@/store/hq-store";
import { Sparkline } from "./sparkline";
import { cn } from "@/lib/utils";

export function TrendingStocks({ limit = 5 }: { limit?: number }) {
  const stocks = useHQ((s) => s.trendingStocks);
  const setSearch = useHQ((s) => s.setSearch);

  if (!stocks.length) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        Scanning tickers…
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {stocks.slice(0, limit).map((s) => {
        const up = s.change >= 0;
        return (
          <button
            key={s.ticker}
            onClick={() => setSearch(s.ticker)}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-black/[0.04]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="tabular text-sm font-bold">${s.ticker}</span>
                <span className="rounded bg-black/[0.06] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {s.mentions}
                </span>
              </div>
              <p className="truncate text-[11px] text-muted-foreground">{s.name}</p>
            </div>
            <Sparkline data={s.sparkline} positive={up} />
            <span
              className={cn(
                "tabular w-14 text-right text-xs font-semibold",
                up ? "text-emerald-600" : "text-destructive"
              )}
            >
              {up ? "+" : ""}
              {s.change.toFixed(1)}%
            </span>
          </button>
        );
      })}
    </div>
  );
}
