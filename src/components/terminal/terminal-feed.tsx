"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, Pin, Play, X } from "lucide-react";
import { useTerminal } from "@/store/terminal-store";
import { cn } from "@/lib/utils";
import { useTerminalFeed } from "./use-terminal-feed";
import { TerminalRow } from "./terminal-row";
import { HostBadge } from "./host-badge";
import { Composer } from "@/components/feed/composer";
import { PlatformGlyph } from "@/components/brand/platform-icon";
import { DATA_MODE, PLATFORMS, SOURCE_PAIRS } from "@/lib/config";
import { useHQ } from "@/store/hq-store";
import { STATUS_META, useLiveStatus } from "@/lib/data/live-status";

/** The terminal's center stage: header strip → pinned plate → feed → hold bar. */
export function TerminalFeed() {
  const { messages, buffered, frozen } = useTerminalFeed();
  const setPaused = useTerminal((s) => s.setPaused);

  // Auto-scroll mechanics — same proven pattern as the stream chat feed.
  const viewportRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  // Track the tail by message id, not by length: the buffer caps and slides, so
  // once it's full the length plateaus while content keeps arriving. A length
  // delta would freeze auto-follow at the cap.
  const lastSeenIdRef = useRef<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [newCount, setNewCount] = useState(0);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setNewCount(0);
    setAtBottom(true);
    atBottomRef.current = true;
  };

  useEffect(() => {
    scrollToBottom("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const lastId = messages.length ? messages[messages.length - 1].id : null;
    if (lastId === lastSeenIdRef.current) return; // tail unchanged — nothing new
    let added = 1;
    if (lastSeenIdRef.current) {
      const idx = messages.findIndex((m) => m.id === lastSeenIdRef.current);
      added = idx === -1 ? messages.length : messages.length - 1 - idx;
    }
    lastSeenIdRef.current = lastId;
    if (added <= 0) return;
    if (atBottomRef.current) {
      // Follow with an INSTANT jump, not smooth: the sim fires bursts of 2–4
      // messages, and a smooth animation grows shorter than the content, so its
      // mid-flight position reads as "scrolled up" and auto-follow de-sticks.
      // An instant jump always lands exactly at the bottom in a single event.
      // Call directly (not via rAF) — the effect already runs after layout, so
      // scrollHeight is final, and rAF is throttled when the tab isn't focused.
      scrollToBottom("auto");
    } else {
      setNewCount((c) => c + added);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleScroll = () => {
    const el = viewportRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    const bottom = dist < 80;
    atBottomRef.current = bottom;
    setAtBottom(bottom);
    if (bottom) setNewCount(0);
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-col">
      <FeedHeader showing={messages.length} buffered={frozen ? 0 : buffered} />
      <PinnedPlate />

      <div className="relative min-h-0 flex-1">
        <div
          ref={viewportRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto px-3 py-2"
        >
          {messages.length === 0 ? (
            <EmptyFeed />
          ) : (
            <div className="mx-auto flex w-full max-w-[920px] flex-col">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <TerminalRow message={m} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {!atBottom && newCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-gold/30 bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold shadow-lg backdrop-blur-md transition-colors hover:bg-gold/25"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            {newCount} new message{newCount > 1 ? "s" : ""}
          </motion.button>
        )}
      </div>

      {/* Hold bar — the feed is frozen, traffic keeps counting */}
      {frozen && (
        <div
          data-hold-bar
          className="flex shrink-0 items-center justify-between gap-3 border-t border-hq/30 bg-hq/15 px-4 py-2"
        >
          <span className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.14em] text-hq">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-hq" />
            Feed held
            <span className="font-mono tabular-nums text-white/70">
              +{buffered} new
            </span>
          </span>
          <button
            onClick={() => setPaused(false)}
            className="flex items-center gap-1.5 rounded-md border border-hq/40 bg-hq/20 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-hq/35"
          >
            <Play className="h-3 w-3" /> Resume
          </button>
        </div>
      )}

      {/* Native composer — post straight into the unified feed as HQ chat. The
          shared component rides the .dark flips like it does in the Lounge. */}
      <div className="shrink-0">
        <Composer placeholder="Message the room…" />
      </div>
    </div>
  );
}

/** Header strip: eyebrow + showing count + the active-filter readout. */
function FeedHeader({ showing, buffered }: { showing: number; buffered: number }) {
  const slowMode = useTerminal((s) => s.slowMode);
  return (
    <div className="flex h-9 shrink-0 items-center gap-2.5 border-b border-white/10 px-4">
      <span className="eyebrow text-white/40">Unified feed</span>
      <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] tabular-nums text-white/60">
        {showing} showing
      </span>
      {slowMode > 0 && (
        <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-gold">
          Slow {slowMode}s{buffered > 0 ? ` · +${buffered}` : ""}
        </span>
      )}
      <ActiveFilterChips />
    </div>
  );
}

/** Compact readout of every narrowing filter, each individually clearable. */
function ActiveFilterChips() {
  const sources = useTerminal((s) => s.sources);
  const tickerFilter = useTerminal((s) => s.tickerFilter);
  const questionsOnly = useTerminal((s) => s.questionsOnly);
  const highSignalOnly = useTerminal((s) => s.highSignalOnly);
  const modsOnly = useTerminal((s) => s.modsOnly);
  const search = useTerminal((s) => s.search);
  const setTickerFilter = useTerminal((s) => s.setTickerFilter);
  const toggleQuestionsOnly = useTerminal((s) => s.toggleQuestionsOnly);
  const toggleHighSignal = useTerminal((s) => s.toggleHighSignal);
  const toggleModsOnly = useTerminal((s) => s.toggleModsOnly);
  const setAllSources = useTerminal((s) => s.setAllSources);

  const sourcesOn = SOURCE_PAIRS.filter((p) => sources[p.key]).length;
  const chips: { label: string; clear: () => void }[] = [];
  if (sourcesOn < SOURCE_PAIRS.length)
    chips.push({ label: `${sourcesOn}/${SOURCE_PAIRS.length} sources`, clear: () => setAllSources(true) });
  if (tickerFilter) chips.push({ label: `$${tickerFilter}`, clear: () => setTickerFilter(null) });
  if (questionsOnly) chips.push({ label: "Questions", clear: toggleQuestionsOnly });
  if (highSignalOnly) chips.push({ label: "High signal", clear: toggleHighSignal });
  if (modsOnly) chips.push({ label: "Mods & VIPs", clear: toggleModsOnly });
  if (search.trim()) chips.push({ label: `“${search.trim()}”`, clear: () => useTerminal.getState().setSearch("") });

  if (chips.length === 0) return null;
  return (
    <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
      {chips.map((c) => (
        <button
          key={c.label}
          onClick={c.clear}
          title="Clear filter"
          className="flex shrink-0 items-center gap-1 rounded-full border border-hq/30 bg-hq/10 px-2 py-0.5 text-[10px] font-semibold text-hq transition-colors hover:bg-hq/20"
        >
          {c.label}
          <X className="h-2.5 w-2.5" />
        </button>
      ))}
      <ResetFiltersLink className="ml-0.5" />
    </div>
  );
}

/** Empty feed — distinguish "filters exclude everything" from "connected to the
    real rooms, nobody has said anything yet" (live mode starts empty by design). */
function EmptyFeed() {
  const totalBuffered = useHQ((s) => s.messages.length);
  const liveStatus = useLiveStatus((s) => s.status);
  const liveDetail = useLiveStatus((s) => s.detail);

  if (DATA_MODE === "live" && totalBuffered === 0) {
    const rows = (["twitch", "kick", "youtube", "x"] as const).filter((p) => liveStatus[p]);
    return (
      <div data-live-waiting className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <div>
          <p className="font-display text-[16px] text-white/85">Listening to the real rooms.</p>
          <p className="mt-1 text-[12px] text-white/40">
            This feed is live-only — it moves when someone actually chats.
          </p>
        </div>
        <div className="w-full max-w-[360px] space-y-1.5">
          {rows.map((p) => {
            const meta = STATUS_META[liveStatus[p]];
            return (
              <div
                key={p}
                className="flex items-center gap-2.5 rounded-md bg-white/[0.03] px-3 py-2 text-left ring-1 ring-white/[0.06]"
              >
                <PlatformGlyph platform={p} className="h-3.5 w-3.5 shrink-0" />
                <span className="w-16 shrink-0 text-[11px] font-semibold text-white/80">
                  {PLATFORMS[p].label}
                </span>
                <span
                  className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot, meta.pulse && "animate-pulse")}
                />
                <span className="min-w-0 flex-1 truncate text-[10.5px] text-white/45">
                  {liveDetail[p] || meta.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-white/40">
      <p className="font-display text-[15px]">Nothing matches the desk filters.</p>
      <ResetFiltersLink />
    </div>
  );
}

function ResetFiltersLink({ className }: { className?: string }) {
  const resetFilters = useTerminal((s) => s.resetFilters);
  return (
    <button
      onClick={resetFilters}
      className={cn(
        "shrink-0 text-[10px] font-medium text-white/40 underline-offset-2 transition-colors hover:text-white/80 hover:underline",
        className
      )}
    >
      Reset
    </button>
  );
}

/** Gold-ruled plate for the pinned message, above the feed. */
function PinnedPlate() {
  const pinned = useTerminal((s) => s.pinned);
  const unpin = useTerminal((s) => s.unpin);
  if (!pinned) return null;
  return (
    <div data-pinned-plate className="shrink-0 border-b border-gold/20 bg-gold/[0.06] px-4 py-2">
      <div className="mx-auto flex w-full max-w-[920px] items-start gap-2.5 border-l-2 border-gold pl-3">
        <Pin className="mt-[3px] h-3.5 w-3.5 shrink-0 text-gold" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gold/90">
              Pinned
            </span>
            <PlatformGlyph platform={pinned.platform} className="h-3 w-3" />
            <HostBadge host={pinned.source} />
            <span className="truncate text-[11px] font-semibold text-white/70">
              {pinned.displayName}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[13px] text-white/90">{pinned.content}</p>
        </div>
        <button
          onClick={unpin}
          aria-label="Unpin"
          title="Unpin"
          className="mt-0.5 rounded p-1 text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
