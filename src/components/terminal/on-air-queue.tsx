"use client";

import { ArrowUpToLine, ListPlus, X } from "lucide-react";
import { useTerminal } from "@/store/terminal-store";
import { PlatformGlyph } from "@/components/brand/platform-icon";
import { HostBadge } from "./host-badge";

/**
 * The On-Air Queue: messages the operator has staged for the broadcast lower
 * third. `queue[0]` is live ON AIR; the rest wait their turn. Promote pulls a
 * message straight to air.
 */
export function OnAirQueue() {
  const queue = useTerminal((s) => s.queue);
  const dequeue = useTerminal((s) => s.dequeue);
  const promote = useTerminal((s) => s.promote);
  const clearQueue = useTerminal((s) => s.clearQueue);

  return (
    <section data-onair-queue>
      <div className="mb-2 flex items-center justify-between px-2">
        <h3 className="eyebrow text-white/40">On-Air Queue</h3>
        {queue.length > 1 && (
          <button
            onClick={clearQueue}
            className="text-[10px] font-medium text-white/35 transition-colors hover:text-white/70"
          >
            Clear
          </button>
        )}
      </div>

      {queue.length === 0 ? (
        <div className="mx-2 flex items-center gap-2 rounded-md border border-dashed border-white/15 px-3 py-3 text-[11px] leading-relaxed text-white/35">
          <ListPlus className="h-4 w-4 shrink-0" />
          Hover a message and queue it — the front of the line shows on the
          broadcast lower third.
        </div>
      ) : (
        <div className="space-y-1.5 px-2">
          {/* ON AIR — the front of the line */}
          <div className="overflow-hidden rounded-md ring-1 ring-hq/40">
            <div className="flex items-center justify-between bg-hq px-2.5 py-1">
              <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                On Air
              </span>
              <button
                onClick={() => dequeue(queue[0].id)}
                aria-label="Remove from air"
                title="Remove from air"
                className="rounded p-0.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="bg-white/[0.04] px-3 py-2.5">
              <p className="font-display text-[13px] font-medium leading-snug text-white/95">
                {queue[0].content}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-white/50">
                <PlatformGlyph platform={queue[0].platform} className="h-3 w-3" />
                <HostBadge host={queue[0].source} />
                <span className="truncate font-medium">{queue[0].displayName}</span>
              </div>
            </div>
          </div>

          {/* Up next */}
          {queue.slice(1).map((m, i) => (
            <div
              key={m.id}
              className="group flex items-start gap-2 rounded-md bg-white/[0.03] px-2.5 py-1.5 ring-1 ring-white/[0.06]"
            >
              <span className="mt-px shrink-0 font-mono text-[10px] tabular-nums text-white/30">
                {i + 2}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11.5px] text-white/85">{m.content}</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-white/40">
                  <PlatformGlyph platform={m.platform} className="h-2.5 w-2.5" />
                  <span className="truncate">{m.displayName}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => promote(m.id)}
                  aria-label="Put on air"
                  title="Put on air"
                  className="rounded p-1 text-white/50 transition-colors hover:bg-white/[0.08] hover:text-gold"
                >
                  <ArrowUpToLine className="h-3 w-3" />
                </button>
                <button
                  onClick={() => dequeue(m.id)}
                  aria-label="Remove from queue"
                  title="Remove from queue"
                  className="rounded p-1 text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
