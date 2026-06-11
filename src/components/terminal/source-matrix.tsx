"use client";

import { useMemo } from "react";
import { HelpCircle, ShieldCheck, Zap } from "lucide-react";
import {
  DATA_MODE,
  HOSTS,
  HOST_ORDER,
  SOURCE_PAIRS,
  type SourcePair,
} from "@/lib/config";
import { cn } from "@/lib/utils";
import { PlatformGlyph } from "@/components/brand/platform-icon";
import { useHQ } from "@/store/hq-store";
import { useTerminal } from "@/store/terminal-store";
import { STATUS_META, useLiveStatus } from "@/lib/data/live-status";
import { HOST_TAG } from "./host-badge";

/**
 * The Source Matrix — every room the aggregator listens to, grouped by host,
 * each independently toggleable (double-click to solo). Below it: the signal
 * filters and the ticker focus chips. The operator's left hand.
 */
export function SourceMatrix() {
  const sources = useTerminal((s) => s.sources);
  const setAllSources = useTerminal((s) => s.setAllSources);
  const anyOff = SOURCE_PAIRS.some((p) => !sources[p.key]);

  return (
    <div className="no-scrollbar flex h-full min-h-0 flex-col gap-5 overflow-y-auto px-3 py-4">
      <section>
        <div className="mb-2 flex items-center justify-between px-2">
          <h3 className="eyebrow text-white/40">Source Matrix</h3>
          {anyOff && (
            <button
              onClick={() => setAllSources(true)}
              className="text-[10px] font-semibold text-gold transition-colors hover:text-gold/80"
            >
              All on
            </button>
          )}
        </div>
        <div className="space-y-3">
          {HOST_ORDER.map((host) => (
            <div key={host}>
              <div className="mb-0.5 flex items-center gap-1.5 px-2">
                <span
                  className={cn("h-1.5 w-1.5 rounded-full", HOST_TAG[host].dot)}
                  aria-hidden
                />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">
                  {HOSTS[host].label}
                </span>
              </div>
              {SOURCE_PAIRS.filter((p) => p.host === host).map((pair) => (
                <SourceRow key={pair.key} pair={pair} />
              ))}
            </div>
          ))}
        </div>
        <p className="mt-2 px-2 text-[9.5px] leading-relaxed text-white/25">
          Click to toggle · double-click to solo
        </p>
      </section>

      <section>
        <h3 className="eyebrow mb-2 px-2 text-white/40">Signal</h3>
        <SignalToggle
          icon={<HelpCircle className="h-3.5 w-3.5" />}
          label="Questions only"
          selector={(s) => s.questionsOnly}
          actionName="toggleQuestionsOnly"
        />
        <SignalToggle
          icon={<Zap className="h-3.5 w-3.5" />}
          label="High signal"
          selector={(s) => s.highSignalOnly}
          actionName="toggleHighSignal"
        />
        <SignalToggle
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          label="Mods & VIPs"
          selector={(s) => s.modsOnly}
          actionName="toggleModsOnly"
        />
      </section>

      <section>
        <h3 className="eyebrow mb-2 px-2 text-white/40">Ticker focus</h3>
        <TickerChips />
      </section>
    </div>
  );
}

function SourceRow({ pair }: { pair: SourcePair }) {
  const on = useTerminal((s) => s.sources[pair.key]);
  const toggleSource = useTerminal((s) => s.toggleSource);
  const soloSource = useTerminal((s) => s.soloSource);

  return (
    <button
      data-matrix-row={pair.key}
      onClick={() => toggleSource(pair.key)}
      onDoubleClick={() => soloSource(pair.key)}
      title="Click to toggle · double-click to solo"
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-all hover:bg-white/[0.05]",
        !on && "opacity-40 grayscale"
      )}
    >
      <MiniSwitch on={on} />
      <PlatformGlyph platform={pair.platform} className="h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-[12px] text-white/85">
        {pair.channel}
      </span>
      <SourceLiveDot platform={pair.platform} />
      <SourceCount pair={pair} />
    </button>
  );
}

/** Real connection state for the room's transport (live mode only). */
function SourceLiveDot({ platform }: { platform: SourcePair["platform"] }) {
  const status = useLiveStatus((s) => s.status[platform]);
  const detail = useLiveStatus((s) => s.detail[platform]);
  if (DATA_MODE !== "live" || !status) return null;
  const meta = STATUS_META[status];
  return (
    <span
      data-live-dot={status}
      title={detail || meta.label}
      className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot, meta.pulse && "animate-pulse")}
    />
  );
}

/** Small display-only pill switch — the row itself is the control. */
function MiniSwitch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex h-3.5 w-6 shrink-0 items-center rounded-full transition-colors",
        on ? "bg-hq" : "bg-white/15"
      )}
    >
      <span
        className={cn(
          "absolute h-2.5 w-2.5 rounded-full bg-white shadow transition-transform",
          on ? "translate-x-[11px]" : "translate-x-[2px]"
        )}
      />
    </span>
  );
}

/** Live per-room count over the current buffer — isolated subscriber so only
    this cell re-renders as messages flow. */
function SourceCount({ pair }: { pair: SourcePair }) {
  const count = useHQ((s) => {
    let c = 0;
    for (const m of s.messages)
      if (m.platform === pair.platform && m.source === pair.host) c++;
    return c;
  });
  return (
    <span className="shrink-0 font-mono text-[10px] tabular-nums text-white/35">
      {count}
    </span>
  );
}

function SignalToggle({
  icon,
  label,
  selector,
  actionName,
}: {
  icon: React.ReactNode;
  label: string;
  selector: (s: ReturnType<typeof useTerminal.getState>) => boolean;
  actionName: "toggleQuestionsOnly" | "toggleHighSignal" | "toggleModsOnly";
}) {
  const on = useTerminal(selector);
  const toggle = useTerminal((s) => s[actionName]);
  return (
    <button
      onClick={toggle}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/[0.05]",
        on ? "text-white" : "text-white/55"
      )}
    >
      <MiniSwitch on={on} />
      <span className={cn(on ? "text-hq" : "text-white/35")}>{icon}</span>
      <span className="flex-1 text-[12px] font-medium">{label}</span>
    </button>
  );
}

function TickerChips() {
  const trendingStocks = useHQ((s) => s.trendingStocks);
  const tickerFilter = useTerminal((s) => s.tickerFilter);
  const setTickerFilter = useTerminal((s) => s.setTickerFilter);

  const tickers = useMemo(() => {
    const set = new Set(trendingStocks.map((t) => t.ticker));
    if (tickerFilter) set.add(tickerFilter);
    return [...set].slice(0, 8);
  }, [trendingStocks, tickerFilter]);

  if (tickers.length === 0)
    return <p className="px-2 text-[11px] text-white/30">Listening for tickers…</p>;

  return (
    <div className="flex flex-wrap gap-1.5 px-2">
      {tickers.map((t) => {
        const active = tickerFilter === t;
        return (
          <button
            key={t}
            onClick={() => setTickerFilter(active ? null : t)}
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold transition-colors",
              active
                ? "bg-hq text-white"
                : "bg-white/[0.06] text-white/75 ring-1 ring-white/10 hover:bg-white/[0.1]"
            )}
          >
            ${t}
          </button>
        );
      })}
    </div>
  );
}
