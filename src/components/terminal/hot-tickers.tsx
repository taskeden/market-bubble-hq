"use client";

import { useHQ } from "@/store/hq-store";
import { useTerminal } from "@/store/terminal-store";
import { Sparkline } from "@/components/widgets/sparkline";
import { cn } from "@/lib/utils";

/** Hot Tickers — what the room is talking about, with the simulated tape move.
    Clicking a row focuses the whole feed on that symbol. */
export function HotTickers() {
  const trendingStocks = useHQ((s) => s.trendingStocks);
  const tickerFilter = useTerminal((s) => s.tickerFilter);
  const setTickerFilter = useTerminal((s) => s.setTickerFilter);

  return (
    <section data-hot-tickers>
      <h3 className="eyebrow mb-2 px-2 text-white/40">Hot Tickers</h3>
      {trendingStocks.length === 0 ? (
        <p className="px-2 text-[11px] text-white/30">Listening for tickers…</p>
      ) : (
        <div className="space-y-0.5 px-2">
          {trendingStocks.slice(0, 6).map((t) => {
            const active = tickerFilter === t.ticker;
            const up = t.change >= 0;
            return (
              <button
                key={t.ticker}
                onClick={() => setTickerFilter(active ? null : t.ticker)}
                title={`${t.name} — filter feed to $${t.ticker}`}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                  active ? "bg-hq/15 ring-1 ring-hq/40" : "hover:bg-white/[0.04]"
                )}
              >
                <span
                  className={cn(
                    "w-14 shrink-0 font-mono text-[12px] font-bold",
                    active ? "text-hq" : "text-white/90"
                  )}
                >
                  ${t.ticker}
                </span>
                <span className="min-w-0 flex-1 truncate text-[10px] text-white/40">
                  {t.mentions} mention{t.mentions === 1 ? "" : "s"}
                </span>
                <Sparkline data={t.sparkline} positive={up} width={44} height={16} />
                <span
                  className={cn(
                    "w-14 shrink-0 text-right font-mono text-[11px] tabular-nums",
                    up ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {up ? "▲" : "▼"} {Math.abs(t.change).toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
