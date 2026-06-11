"use client";

import { useMemo } from "react";
import { ListPlus, Pin } from "lucide-react";
import { useHQ } from "@/store/hq-store";
import { useTerminal } from "@/store/terminal-store";
import { isQuestion } from "@/lib/data/signals";
import { PlatformGlyph } from "@/components/brand/platform-icon";
import { HostBadge } from "./host-badge";

/**
 * Top Questions — the audience questions most worth answering right now,
 * scored by recency, reactions and ticker relevance. One click pins or queues
 * a question for air.
 */
export function TopQuestions() {
  const messages = useHQ((s) => s.messages);
  const pin = useTerminal((s) => s.pin);
  const enqueue = useTerminal((s) => s.enqueue);

  const top = useMemo(() => {
    const now = Date.now();
    return messages
      .filter((m) => m.kind === "chat" && isQuestion(m))
      .map((m) => ({
        m,
        score:
          Math.max(0, 1 - (now - m.timestamp) / 300_000) * 3 +
          (m.reactions ?? 0) * 2 +
          m.tickers.length * 2,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [messages]);

  return (
    <section data-top-questions>
      <h3 className="eyebrow mb-2 px-2 text-white/40">Top Questions</h3>
      {top.length === 0 ? (
        <p className="px-2 text-[11px] text-white/30">No open questions in the room.</p>
      ) : (
        <div className="space-y-1 px-2">
          {top.map(({ m }) => (
            <div
              key={m.id}
              className="group rounded-md px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
            >
              <p className="line-clamp-2 text-[11.5px] leading-snug text-white/85">
                {m.content}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <PlatformGlyph platform={m.platform} className="h-2.5 w-2.5" />
                <HostBadge host={m.source} />
                <span className="min-w-0 flex-1 truncate text-[9.5px] text-white/40">
                  {m.displayName}
                </span>
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => pin(m)}
                    aria-label="Pin question"
                    title="Pin question"
                    className="rounded p-1 text-white/50 transition-colors hover:bg-white/[0.08] hover:text-gold"
                  >
                    <Pin className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => enqueue(m)}
                    aria-label="Queue question"
                    title="Queue question"
                    className="rounded p-1 text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white"
                  >
                    <ListPlus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
