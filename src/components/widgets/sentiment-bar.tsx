"use client";

import { useHQ } from "@/store/hq-store";

export function SentimentBar() {
  const sentiment = useHQ((s) => s.stats.sentiment);
  const segments = [
    { key: "bullish", value: sentiment.bullish, color: "hsl(150 70% 48%)", label: "Bullish" },
    { key: "neutral", value: sentiment.neutral, color: "hsl(217 18% 42%)", label: "Neutral" },
    { key: "bearish", value: sentiment.bearish, color: "hsl(0 72% 55%)", label: "Bearish" },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold text-emerald-600 tabular">
          {sentiment.bullish}%
        </span>
        <span className="text-xs text-muted-foreground">bullish sentiment</span>
      </div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full">
        {segments.map((s) => (
          <div
            key={s.key}
            className="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
            style={{ width: `${s.value}%`, background: s.color }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px]">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            <span className="text-muted-foreground">
              {s.label} <span className="tabular text-foreground">{s.value}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
