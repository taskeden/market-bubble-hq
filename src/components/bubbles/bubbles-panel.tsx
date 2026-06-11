"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  ScrollText,
  BarChart3,
  Activity,
  Star,
  Clapperboard,
  MessageCircle,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { useHQ } from "@/store/hq-store";
import { BubblesAvatar } from "@/components/brand/bubbles-avatar";
import { PollCard } from "./poll-card";
import { BUBBLES } from "@/lib/data/bubbles";
import type { BubblesActionType } from "@/lib/types";
import { cn, formatClock } from "@/lib/utils";

const ICONS: Record<BubblesActionType, React.ComponentType<{ className?: string }>> = {
  welcome: UserPlus,
  summary: ScrollText,
  poll: BarChart3,
  sentiment: Activity,
  highlight: Star,
  recap: Clapperboard,
  answer: MessageCircle,
  trending: TrendingUp,
};

const QUICK: { type: BubblesActionType; label: string }[] = [
  { type: "summary", label: "Summarize" },
  { type: "sentiment", label: "Sentiment" },
  { type: "trending", label: "Trending" },
  { type: "poll", label: "New poll" },
  { type: "highlight", label: "Highlight" },
  { type: "recap", label: "Recap" },
];

/** Renders insight body with **bold** segments. */
function Body({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-semibold text-foreground">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export function BubblesPanel({ className }: { className?: string }) {
  const insights = useHQ((s) => s.insights);
  const requestBubbles = useHQ((s) => s.requestBubbles);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-black/[0.06] p-4">
        <div className="relative">
          <BubblesAvatar size={44} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold tracking-tight">{BUBBLES.name}</h2>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              online
            </span>
          </div>
          <p className="text-[11px] text-bubble/80">{BUBBLES.tagline}</p>
        </div>
        <Sparkles className="h-4 w-4 text-bubble" />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-1.5 border-b border-black/[0.06] p-3">
        {QUICK.map((q) => (
          <button
            key={q.type}
            onClick={() => requestBubbles(q.type)}
            className="rounded-full border border-bubble/20 bg-bubble/5 px-2.5 py-1 text-[11px] font-medium text-bubble/90 transition-colors hover:bg-bubble/15"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Stream of insights */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        <PollCard />
        <AnimatePresence initial={false}>
          {insights.map((insight) => {
            const Icon = ICONS[insight.type] ?? Sparkles;
            return (
              <motion.div
                key={insight.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-black/[0.06] bg-black/[0.02] p-3.5"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-bubble/10 text-bubble">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-semibold">{insight.title}</span>
                  <span className="tabular ml-auto text-[10px] text-muted-foreground">
                    {formatClock(insight.timestamp)}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-foreground/80">
                  <Body text={insight.body} />
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {insights.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
            <BubblesAvatar size={56} />
            <p className="mt-2 text-sm font-medium text-foreground">Bubbles is warming up…</p>
            <p className="text-xs">Insights, summaries and polls will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
