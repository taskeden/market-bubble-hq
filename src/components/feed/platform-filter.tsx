"use client";

import { useHQ } from "@/store/hq-store";
import { PLATFORM_ORDER, PLATFORMS } from "@/lib/config";
import { PlatformGlyph } from "@/components/brand/platform-icon";
import { cn } from "@/lib/utils";

export function PlatformFilter() {
  const filterPlatforms = useHQ((s) => s.filterPlatforms);
  const togglePlatform = useHQ((s) => s.togglePlatform);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PLATFORM_ORDER.map((p) => {
        const meta = PLATFORMS[p];
        const active = filterPlatforms[p];
        return (
          <button
            key={p}
            onClick={() => togglePlatform(p)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
              active
                ? "border-black/10 bg-black/[0.06] text-foreground"
                : "border-transparent bg-transparent text-muted-foreground/50 opacity-60 hover:opacity-100"
            )}
            style={
              active
                ? { boxShadow: `inset 0 0 0 1px hsl(${meta.hsl} / 0.25)` }
                : undefined
            }
          >
            <PlatformGlyph
              platform={p}
              className={cn("h-3.5 w-3.5", !active && "grayscale")}
            />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
