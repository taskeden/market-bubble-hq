"use client";

import { useEffect, useState } from "react";
import { marketSnapshot } from "@/lib/data/intelligence";
import { cn } from "@/lib/utils";

interface Tick {
  ticker: string;
  price: number;
  change: number;
}

function fmtPrice(p: number) {
  return p >= 1000
    ? p.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : p.toFixed(2);
}

/**
 * The MARKET WATCH broadcast strip — a dark stock-channel footer with a fixed,
 * stationary spread of prices (values still update live; the row doesn't scroll).
 */
export function TickerTape({ className }: { className?: string }) {
  const [ticks, setTicks] = useState<Tick[]>([]);

  useEffect(() => {
    const pull = () =>
      setTicks(marketSnapshot().map((s) => ({ ticker: s.ticker, price: s.price, change: s.change })));
    pull();
    const id = setInterval(pull, 2200);
    return () => clearInterval(id);
  }, []);

  if (!ticks.length) return null;
  const shown = ticks.slice(0, 11);

  return (
    <div
      className={cn(
        // z-50 so the bar paints above the Bubbles dock (z-40) and masks her
        // bottom — she stays locked peeking over the bar's top edge.
        "relative z-50 flex h-9 items-stretch border-t border-white/10 bg-ink",
        className
      )}
    >
      {/* MARKET WATCH tab */}
      <div className="relative z-10 flex shrink-0 items-center bg-hq pl-3 pr-5 [clip-path:polygon(0_0,100%_0,calc(100%-12px)_100%,0_100%)]">
        <span className="eyebrow text-[10px] tracking-[0.18em] text-primary-foreground">
          Market Watch
        </span>
      </div>

      {/* stationary, evenly spread prices */}
      <div className="mask-fade-x flex flex-1 items-center justify-between gap-4 overflow-hidden px-5">
        {shown.map((t, i) => {
          const up = t.change >= 0;
          return (
            <span key={i} className="flex shrink-0 items-center gap-2">
              <span className="tabular text-[11px] font-bold tracking-wide text-white/90">
                {t.ticker}
              </span>
              <span className="tabular text-[11px] text-white/50">{fmtPrice(t.price)}</span>
              <span
                className={cn(
                  "tabular flex items-center gap-0.5 text-[11px] font-semibold",
                  up ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {up ? "▲" : "▼"} {Math.abs(t.change).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
