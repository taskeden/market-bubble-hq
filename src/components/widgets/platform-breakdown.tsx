"use client";

import { useHQ } from "@/store/hq-store";
import { PLATFORMS } from "@/lib/config";
import { PlatformIcon } from "@/components/brand/platform-icon";
import { formatCompact, cn } from "@/lib/utils";

export function PlatformBreakdown({ compact = false }: { compact?: boolean }) {
  const breakdown = useHQ((s) => s.stats.platformBreakdown);

  return (
    <div className="space-y-3">
      {breakdown.map((row) => {
        const meta = PLATFORMS[row.platform];
        return (
          <div key={row.platform} className="flex items-center gap-3">
            <PlatformIcon platform={row.platform} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium">{meta.label}</span>
                <span className="tabular text-xs text-muted-foreground">
                  {Math.round(row.share * 100)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.max(3, row.share * 100)}%`,
                    background: `hsl(${meta.hsl})`,
                    boxShadow: `0 0 12px hsl(${meta.hsl} / 0.5)`,
                  }}
                />
              </div>
            </div>
            {!compact && (
              <span className="tabular w-12 text-right text-xs text-muted-foreground">
                {formatCompact(row.messages)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
