"use client";

import { useEffect, useState } from "react";
import {
  ChevronsLeft,
  Clapperboard,
  PanelLeft,
  PanelRight,
  Pause,
  Play,
  Search,
  Timer,
  X,
} from "lucide-react";
import { useHQ } from "@/store/hq-store";
import { SLOW_MODES, useTerminal } from "@/store/terminal-store";
import { BubbleMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * The terminal's command strip: brand plate · search · velocity · the three
 * desk controls (hold / slow / broadcast) · collapse. On narrow viewports the
 * side rails fold into slide-over panels opened from here.
 */
export function TerminalTopbar({
  onSources,
  onDesk,
}: {
  onSources: () => void;
  onDesk: () => void;
}) {
  const paused = useTerminal((s) => s.paused);
  const setPaused = useTerminal((s) => s.setPaused);
  const slowMode = useTerminal((s) => s.slowMode);
  const setSlowMode = useTerminal((s) => s.setSlowMode);
  const toggleBroadcast = useTerminal((s) => s.toggleBroadcast);
  const closeTerminal = useTerminal((s) => s.closeTerminal);

  const cycleSlow = () => {
    const i = SLOW_MODES.indexOf(slowMode);
    setSlowMode(SLOW_MODES[(i + 1) % SLOW_MODES.length]);
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 px-3 lg:gap-3 lg:px-4">
      {/* Brand mark */}
      <div className="flex shrink-0 items-center pr-1">
        <BubbleMark className="h-8 w-8 invert" />
      </div>

      {/* Rail openers — narrow viewports only */}
      <TopButton label="Sources" onClick={onSources} className="lg:hidden">
        <PanelLeft className="h-3.5 w-3.5" />
      </TopButton>
      <TopButton label="Desk" onClick={onDesk} className="xl:hidden">
        <PanelRight className="h-3.5 w-3.5" />
      </TopButton>

      <SearchBox />

      <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:gap-2">
        <VelocityMeter />

        <TopButton
          label={paused ? "Resume the feed" : "Hold the feed"}
          onClick={() => setPaused(!paused)}
          active={paused}
          activeClass="border-hq/50 bg-hq/15 text-hq"
          data-pause-button
        >
          {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          <span className="hidden md:inline">{paused ? "Held" : "Hold"}</span>
        </TopButton>

        <TopButton
          label="Slow mode — release the feed in measured beats"
          onClick={cycleSlow}
          active={slowMode > 0}
          activeClass="border-gold/50 bg-gold/15 text-gold"
          data-slow-button
        >
          <Timer className="h-3.5 w-3.5" />
          <span className="hidden md:inline">
            {slowMode === 0 ? "Slow" : `${slowMode}s`}
          </span>
        </TopButton>

        <TopButton
          label="Broadcast clean mode — the on-stream view"
          onClick={toggleBroadcast}
          activeClass=""
          data-broadcast-button
        >
          <Clapperboard className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Broadcast</span>
        </TopButton>

        <div className="mx-0.5 h-6 w-px bg-white/10" aria-hidden />

        <TopButton label="Collapse to stream chat" onClick={closeTerminal} data-collapse-button>
          <ChevronsLeft className="h-4 w-4" />
        </TopButton>
      </div>
    </header>
  );
}

function TopButton({
  label,
  onClick,
  active = false,
  activeClass = "border-white/30 bg-white/[0.1] text-white",
  className,
  children,
  ...rest
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
  className?: string;
  children: React.ReactNode;
} & Record<`data-${string}`, unknown>) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 text-[11px] font-semibold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white",
        active && activeClass,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Debounced room search. */
function SearchBox() {
  const search = useTerminal((s) => s.search);
  const setSearch = useTerminal((s) => s.setSearch);
  const [q, setQ] = useState(search);

  useEffect(() => {
    const id = setTimeout(() => setSearch(q), 150);
    return () => clearTimeout(id);
  }, [q, setSearch]);

  // Stay in sync when a filter chip clears the search externally.
  useEffect(() => {
    if (search === "") setQ((prev) => (prev === "" ? prev : ""));
  }, [search]);

  return (
    <div className="relative min-w-0 flex-1 lg:max-w-md">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search the room…"
        data-terminal-search
        className="h-9 w-full rounded-md border border-white/10 bg-white/[0.04] pl-8 pr-7 font-mono text-[12px] text-white/90 placeholder:text-white/30 focus:border-white/25 focus:outline-none"
      />
      {q && (
        <button
          onClick={() => setQ("")}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-white/40 transition-colors hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/** Isolated msg/min readout + micro bars — per-tick re-renders stop here. */
function VelocityMeter() {
  const mpm = useHQ((s) => s.stats.messagesPerMinute);
  const timeseries = useHQ((s) => s.timeseries);
  const bars = timeseries.slice(-10).map((p) => p.messages);
  const max = Math.max(1, ...bars);

  return (
    <div
      className="hidden h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2.5 md:flex"
      title="Message velocity"
    >
      <div className="flex h-4 items-end gap-[2px]" aria-hidden>
        {bars.map((b, i) => (
          <span
            key={i}
            className="w-[3px] rounded-sm bg-gold/70"
            style={{ height: `${Math.max(12, (b / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="leading-none">
        <div className="font-mono text-[13px] font-bold tabular-nums text-white">{mpm}</div>
        <div className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.18em] text-white/40">
          msg/min
        </div>
      </div>
    </div>
  );
}
