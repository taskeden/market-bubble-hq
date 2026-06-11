"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { cn, clamp } from "@/lib/utils";

interface Market {
  q: string;
  p: number;
}

const SEED: Market[] = [
  { q: "Anthropic has the best AI model by end of July?", p: 83 },
  { q: "Bitcoin closes above $100K this month?", p: 64 },
  { q: "Fed cuts rates at the July meeting?", p: 38 },
  { q: "$NVDA prints a new all-time high this week?", p: 56 },
  { q: "Polymarket tops $1B volume in June?", p: 71 },
  { q: "A creator hits 1M subs this week?", p: 44 },
  { q: "Will the two-party system end?", p: 12 },
  { q: "$HYPE flips $SOL by year end?", p: 28 },
];

function gaugeColor(v: number) {
  if (v >= 60) return "hsl(150 65% 48%)";
  if (v >= 35) return "hsl(38 60% 60%)";
  return "hsl(4 76% 56%)";
}

function Gauge({ value }: { value: number }) {
  const r = 9.5;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative h-7 w-7 shrink-0">
      <svg viewBox="0 0 26 26" className="h-full w-full -rotate-90">
        <circle cx="13" cy="13" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
        <circle
          cx="13"
          cy="13"
          r={r}
          fill="none"
          stroke={gaugeColor(value)}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
      </svg>
      <span className="tabular absolute inset-0 flex items-center justify-center text-[8px] font-bold">
        {Math.round(value)}
      </span>
    </div>
  );
}

export function PredictionChips({ className }: { className?: string }) {
  const [markets, setMarkets] = useState<Market[]>(SEED);

  useEffect(() => {
    const id = setInterval(() => {
      setMarkets((prev) =>
        prev.map((m) => ({ ...m, p: clamp(m.p + (Math.random() - 0.5) * 3, 2, 98) }))
      );
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const row = [...markets, ...markets]; // duplicate for a seamless loop

  return (
    <div className={cn("flex flex-row items-center gap-2", className)}>
      <div className="flex shrink-0 items-center gap-1.5 pr-1">
        <TrendingUp className="h-4 w-4 text-hq" />
        <h3 className="relative font-hand text-[20px] font-bold leading-none text-hq">
          Live Odds
          {/* Hand-drawn marker underline — matches the widget titles. */}
          <svg
            aria-hidden
            viewBox="0 0 240 12"
            preserveAspectRatio="none"
            className="absolute -bottom-2 left-0 h-[9px] w-full overflow-visible"
          >
            <path
              d="M4 10 Q 120 3.5 236 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </h3>
      </div>
      {/* Continuous right-to-left crawl, stock-channel style. Pauses on hover. */}
      <div className="group mask-fade-x relative flex-1 overflow-hidden">
        <div
          className="flex w-max items-center gap-2 py-0.5 group-hover:[animation-play-state:paused]"
          style={{ animation: "marquee 80s linear infinite" }}
        >
          {row.map((m, i) => (
            <div
              key={i}
              className="flex shrink-0 items-center gap-2.5 rounded-md border border-black/[0.07] bg-card/80 px-2.5 py-1.5"
            >
              <Gauge value={m.p} />
              <div className="min-w-0 max-w-[200px]">
                <p className="truncate text-[11px] font-medium leading-tight text-foreground/90">
                  {m.q}
                </p>
                <p className="text-[9px] text-muted-foreground">
                  <span className="tabular font-semibold text-emerald-600">{Math.round(m.p)}¢</span>{" "}
                  Yes · via Polymarket
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
