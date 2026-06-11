"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, BarChart3 } from "lucide-react";
import { useHQ } from "@/store/hq-store";
import { cn } from "@/lib/utils";

export function PollCard() {
  const poll = useHQ((s) => s.activePoll);
  const vote = useHQ((s) => s.votePoll);
  const [voted, setVoted] = useState<string | null>(null);

  if (!poll) return null;

  const total = Math.max(1, poll.totalVotes);

  return (
    <div className="rounded-2xl border border-bubble/20 bg-bubble/[0.04] p-4">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-bubble" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-bubble">
          Live poll · by Bubbles
        </span>
      </div>
      <p className="mb-3 text-sm font-semibold">{poll.question}</p>
      <div className="space-y-2">
        {poll.options.map((o) => {
          const pct = Math.round((o.votes / total) * 100);
          const isPick = voted === o.id;
          return (
            <button
              key={o.id}
              disabled={!!voted}
              onClick={() => {
                if (voted) return;
                vote(o.id);
                setVoted(o.id);
              }}
              className={cn(
                "relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-colors",
                isPick
                  ? "border-bubble/50 bg-bubble/10"
                  : "border-black/[0.08] hover:border-black/20",
                voted && "cursor-default"
              )}
            >
              {voted && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={cn(
                    "absolute inset-y-0 left-0 -z-0",
                    isPick ? "bg-bubble/20" : "bg-black/[0.05]"
                  )}
                />
              )}
              <div className="relative z-10 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {o.label}
                  {isPick && <Check className="h-3.5 w-3.5 text-bubble" />}
                </span>
                {voted && (
                  <span className="tabular text-xs font-semibold text-muted-foreground">
                    {pct}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        {voted ? `${poll.totalVotes} votes · thanks for voting!` : `${poll.totalVotes} votes · tap to vote`}
      </p>
    </div>
  );
}
