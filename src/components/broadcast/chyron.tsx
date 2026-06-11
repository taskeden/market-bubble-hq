"use client";

import { useEffect, useMemo, useState } from "react";
import { useHQ } from "@/store/hq-store";
import { BubbleMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const BASE_HEADLINES = [
  "Will Bitcoin close above $100K this month?",
  "Is the attention economy the new stock market?",
  "Will the Fed cut rates in July?",
  "Will Anthropic have the best AI model by July?",
  "Will the two-party system end?",
  "Can crypto finally decouple from equities?",
  "Is $HYPE the trade of the cycle?",
];

/**
 * A cable-news lower-third: a stationary ink brand plate (it never moves) beside
 * a glossy platinum headline that slides up on each rotation.
 */
export function HeadlineChyron({
  className,
  noPlate = false,
}: {
  className?: string;
  /** Render just the platinum rotating-headline banner (no brand plate). */
  noPlate?: boolean;
}) {
  const stocks = useHQ((s) => s.trendingStocks);
  const [i, setI] = useState(0);

  const headlines = useMemo(() => {
    const dynamic: string[] = [];
    const leader = stocks[0];
    if (leader) {
      dynamic.push(
        leader.change >= 0
          ? `$${leader.ticker} leads the tape, up ${leader.change.toFixed(1)}%`
          : `$${leader.ticker} slides ${Math.abs(leader.change).toFixed(1)}% as chat watches`
      );
    }
    return [...dynamic, ...BASE_HEADLINES];
  }, [stocks]);

  useEffect(() => {
    const id = setInterval(() => setI((v) => v + 1), 6500);
    return () => clearInterval(id);
  }, []);

  const headline = headlines[i % headlines.length];

  if (noPlate) {
    return (
      <div
        className={cn(
          "chyron flex items-center overflow-hidden rounded-md px-5 py-2.5 shadow-chyron",
          className
        )}
      >
        <span
          key={headline}
          className="animate-chyron-up truncate text-[16px] font-extrabold uppercase leading-tight tracking-[0.01em] sm:text-[18px]"
        >
          {headline}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-stretch overflow-hidden rounded-md shadow-chyron",
        className
      )}
    >
      {/* Stationary brand plate */}
      <div className="flex shrink-0 items-center gap-2 bg-ink px-3.5 py-2.5">
        <BubbleMark className="h-7 w-7 invert" />
        <div className="hidden font-display text-[12px] font-semibold leading-[0.9] tracking-tight text-paper sm:block">
          Market
          <br />
          Bubble
        </div>
      </div>

      {/* Rotating headline — only this slides on change */}
      <div className="chyron flex min-w-0 flex-1 items-center px-5 py-2.5">
        <span
          key={headline}
          className="animate-chyron-up truncate text-[16px] font-extrabold uppercase leading-tight tracking-[0.01em] sm:text-[18px]"
        >
          {headline}
        </span>
      </div>
    </div>
  );
}
