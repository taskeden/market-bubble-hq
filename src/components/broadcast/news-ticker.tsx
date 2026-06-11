"use client";

import { useMemo } from "react";
import { useHQ } from "@/store/hq-store";
import { cn } from "@/lib/utils";

const STATIC_NEWS = [
  "Fed holds rates steady — chat splits on the dot plot",
  "Anthropic favored at 83% for best model by end of July",
  "Bitcoin reclaims $100K as alt rotation heats up",
  "Polymarket June volume tops $1B",
  "AI capex narrative drives mega-cap bid",
  "$HYPE the most-watched ticker in HQ this week",
  "Creators eye prediction markets as the new attention economy",
];

/** `bare` renders just the crawling alerts (no tab/bar) for embedding in the header. */
export function NewsTicker({ className, bare = false }: { className?: string; bare?: boolean }) {
  const stocks = useHQ((s) => s.trendingStocks);
  const topics = useHQ((s) => s.trendingTopics);

  const items = useMemo(() => {
    const dynamic: string[] = [];
    stocks.slice(0, 3).forEach((s) =>
      dynamic.push(
        `$${s.ticker} ${s.change >= 0 ? "▲" : "▼"} ${Math.abs(s.change).toFixed(1)}% — ${s.mentions} mentions`
      )
    );
    topics.slice(0, 2).forEach((t) => dynamic.push(`${t.label} trending (+${Math.max(0, t.velocity)}%)`));
    const all = [...dynamic, ...STATIC_NEWS];
    return all.length ? all : STATIC_NEWS;
  }, [stocks, topics]);

  const row = [...items, ...items];

  const crawl = (
    <div
      className="absolute inset-y-0 flex items-center whitespace-nowrap"
      style={{ animation: "marquee 60s linear infinite" }}
    >
      {row.map((item, i) => (
        <span key={i} className="flex items-center gap-3 px-4 text-[12px] text-foreground/80">
          <span className="font-medium">{item}</span>
          <span className="text-hq">◆</span>
        </span>
      ))}
    </div>
  );

  if (bare) {
    return <div className={cn("mask-fade-x relative overflow-hidden", className)}>{crawl}</div>;
  }

  return (
    <div
      className={cn(
        "relative flex h-8 items-stretch overflow-hidden rounded-md border border-black/10 bg-card/80 shadow-sm",
        className
      )}
    >
      <div className="z-10 flex shrink-0 items-center gap-1.5 bg-ink pl-3 pr-4 [clip-path:polygon(0_0,100%_0,calc(100%-10px)_100%,0_100%)]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-hq" />
        <span className="eyebrow text-[9px] tracking-[0.18em] text-paper">HQ Newsdesk</span>
      </div>
      <div className="mask-fade-x relative flex-1 overflow-hidden">{crawl}</div>
    </div>
  );
}
