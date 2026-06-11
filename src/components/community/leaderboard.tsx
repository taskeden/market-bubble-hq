"use client";

import { useMemo } from "react";
import { Crown } from "lucide-react";
import { getRoster } from "@/lib/data/roster";
import { useHQ } from "@/store/hq-store";
import { UserAvatar } from "@/components/brand/user-avatar";
import { PlatformGlyph } from "@/components/brand/platform-icon";
import { BadgeChip } from "./badge-chip";
import { levelTitle } from "@/lib/config";
import { cn, formatCompact } from "@/lib/utils";
import { rankPfp, pfpPixelated } from "@/lib/data/nft-pfp";

const MEDAL = [
  "from-amber-300 to-yellow-600 text-yellow-950",
  "from-slate-200 to-slate-400 text-slate-900",
  "from-amber-600 to-amber-800 text-amber-100",
];

export function Leaderboard({
  limit = 10,
  showBadges = true,
}: {
  limit?: number;
  showBadges?: boolean;
}) {
  const selectUser = useHQ((s) => s.selectUser);
  const leaders = useMemo(() => getRoster().slice(0, limit), [limit]);

  return (
    <div className="space-y-1.5">
      {leaders.map((u, i) => (
        <button
          key={u.id}
          onClick={() => selectUser(u.id)}
          className={cn(
            "group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5",
            i === 0
              ? "border-hq/30 bg-gradient-to-r from-hq/[0.08] to-transparent"
              : "border-black/[0.06] bg-black/[0.02] hover:border-black/12"
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
              i < 3
                ? `bg-gradient-to-br ${MEDAL[i]}`
                : "bg-black/[0.05] text-muted-foreground"
            )}
          >
            {i < 3 ? <Crown className="h-4 w-4" /> : i + 1}
          </div>

          <UserAvatar
            name={u.displayName}
            platform={u.primaryPlatform}
            size="md"
            online={u.online}
            nft
            nftSrc={rankPfp(u.id, i)}
            nftPixelated={pfpPixelated(rankPfp(u.id, i))}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-semibold">{u.displayName}</span>
              <PlatformGlyph platform={u.primaryPlatform} className="h-3 w-3 shrink-0" />
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>
                Lv {u.level} · {levelTitle(u.level)}
              </span>
              {showBadges && u.badges[0] && (
                <span className="hidden sm:block">
                  <BadgeChip id={u.badges[0]} size="sm" />
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="tabular font-bold text-hq">{u.engagementScore}</div>
            <div className="tabular text-[11px] text-muted-foreground">
              {formatCompact(u.totalMessages)} msgs
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
