"use client";

import { useHQ } from "@/store/hq-store";
import { UserAvatar } from "@/components/brand/user-avatar";
import { PlatformGlyph } from "@/components/brand/platform-icon";
import { cn } from "@/lib/utils";

const MEDAL = ["text-hq", "text-slate-300", "text-amber-700"];

export function MostActive({ limit = 5 }: { limit?: number }) {
  const mostActive = useHQ((s) => s.mostActive);
  const selectUser = useHQ((s) => s.selectUser);

  if (!mostActive.length) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        Listening to the conversation…
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {mostActive.slice(0, limit).map((row, i) => (
        <button
          key={row.user.id}
          onClick={() => selectUser(row.user.id)}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-black/[0.04]"
        >
          <span
            className={cn(
              "tabular w-4 text-center text-xs font-bold",
              i < 3 ? MEDAL[i] : "text-muted-foreground"
            )}
          >
            {i + 1}
          </span>
          <UserAvatar
            name={row.user.displayName}
            platform={row.user.primaryPlatform}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium">
                {row.user.displayName}
              </span>
              <PlatformGlyph
                platform={row.user.primaryPlatform}
                className="h-3 w-3 shrink-0"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {row.count} msg this window
            </p>
          </div>
          <div className="h-7 w-1 rounded-full bg-gradient-to-b from-hq to-hq/20" />
        </button>
      ))}
    </div>
  );
}
