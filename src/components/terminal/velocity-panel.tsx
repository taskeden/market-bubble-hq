"use client";

import { useMemo } from "react";
import { useHQ } from "@/store/hq-store";
import { HOSTS, HOST_ORDER } from "@/lib/config";
import { Sparkline } from "@/components/widgets/sparkline";

/**
 * Message velocity — the room's pulse: live msg/min with its recent curve,
 * plus the last-60s split across the three hosts' rooms.
 */
export function VelocityPanel() {
  const mpm = useHQ((s) => s.stats.messagesPerMinute);
  const timeseries = useHQ((s) => s.timeseries);
  const messages = useHQ((s) => s.messages);

  const series = useMemo(() => timeseries.map((p) => p.messages), [timeseries]);

  const hostCounts = useMemo(() => {
    const cutoff = Date.now() - 60_000;
    const counts: Record<string, number> = { ansem: 0, banks: 0, marketbubble: 0 };
    for (const m of messages) if (m.timestamp >= cutoff) counts[m.source]++;
    const max = Math.max(1, ...Object.values(counts));
    return HOST_ORDER.map((h) => ({ host: h, count: counts[h], frac: counts[h] / max }));
  }, [messages]);

  return (
    <section data-velocity-panel>
      <h3 className="eyebrow mb-2 px-2 text-white/40">Velocity</h3>
      <div className="px-2">
        <div className="flex items-end justify-between rounded-md bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/[0.06]">
          <div>
            <div className="font-mono text-[22px] font-bold leading-none tabular-nums text-white">
              {mpm}
            </div>
            <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
              msg / min
            </div>
          </div>
          {series.length > 1 && (
            <Sparkline data={series.slice(-24)} width={88} height={28} />
          )}
        </div>

        <div className="mt-2 space-y-1.5">
          {hostCounts.map(({ host, count, frac }) => (
            <div key={host} className="flex items-center gap-2">
              <span className="w-9 shrink-0 text-[9px] font-bold uppercase tracking-[0.14em] text-white/50">
                {HOSTS[host].short}
              </span>
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{
                    width: `${Math.max(4, frac * 100)}%`,
                    background: `hsl(${HOSTS[host].hsl})`,
                  }}
                />
              </div>
              <span className="w-7 shrink-0 text-right font-mono text-[10px] tabular-nums text-white/45">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
