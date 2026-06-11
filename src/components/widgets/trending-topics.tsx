"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useHQ } from "@/store/hq-store";
import { cn } from "@/lib/utils";
import type { Sentiment } from "@/lib/types";

const SENT: Record<Sentiment, string> = {
  bullish: "text-emerald-600",
  bearish: "text-destructive",
  neutral: "text-muted-foreground",
};

export function TrendingTopics({ limit = 5 }: { limit?: number }) {
  const topics = useHQ((s) => s.trendingTopics);
  const setSearch = useHQ((s) => s.setSearch);

  if (!topics.length) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        Tracking the conversation…
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {topics.slice(0, limit).map((t, i) => {
        const probe = t.label.replace(/^\$/, "");
        return (
          <button
            key={t.id}
            onClick={() => setSearch(probe)}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-black/[0.04]"
          >
            <span className="tabular w-4 text-center text-xs font-bold text-muted-foreground">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{t.label}</p>
              <p className="text-[11px] text-muted-foreground">
                {t.mentions} mentions
              </p>
            </div>
            <div
              className={cn(
                "flex items-center gap-0.5 text-xs font-semibold",
                t.velocity > 0
                  ? "text-emerald-600"
                  : t.velocity < 0
                    ? "text-destructive"
                    : "text-muted-foreground"
              )}
            >
              {t.velocity > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : t.velocity < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {t.velocity !== 0 && (
                <span className="tabular">{Math.abs(t.velocity)}%</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
