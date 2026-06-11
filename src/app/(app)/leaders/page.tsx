"use client";

import { useMemo } from "react";
import { Trophy, Crown, Medal, Sparkles, Star, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Leaderboard } from "@/components/community/leaderboard";
import { BadgeChip } from "@/components/community/badge-chip";
import { UserAvatar } from "@/components/brand/user-avatar";
import { PlatformGlyph } from "@/components/brand/platform-icon";
import { isMe, MY_PFP } from "@/lib/data/nft-pfp";
import { getRoster } from "@/lib/data/roster";
import { BADGES, levelTitle } from "@/lib/config";
import { useHQ } from "@/store/hq-store";
import { cn, formatCompact, formatNumber } from "@/lib/utils";
import type { BadgeId } from "@/lib/types";

const LEVEL_TIERS = [1, 4, 9, 15, 22, 30, 40, 50];
const RARITY_RING: Record<string, string> = {
  legendary: "ring-amber-400/40",
  epic: "ring-fuchsia-400/40",
  rare: "ring-sky-400/40",
  common: "ring-black/10",
};

export default function LeadersPage() {
  const roster = useMemo(() => getRoster(), []);
  const selectUser = useHQ((s) => s.selectUser);
  const currentUser = useHQ((s) => s.currentUser);
  const mvp = roster[1];
  const podium = roster.slice(0, 3);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Community Leaders"
        description="Recognition for the members who make Market Bubble HQ what it is."
        icon={<Trophy className="h-5 w-5" />}
      />

      {/* Weekly MVP spotlight */}
      <Card className="relative overflow-hidden border-hq/20">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-hq/[0.14] via-transparent to-transparent" />
        <div
          className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-hq/20 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 self-start rounded-full border border-hq/30 bg-hq/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-hq sm:absolute sm:right-6 sm:top-6">
            <Crown className="h-3.5 w-3.5" /> Weekly MVP
          </div>
          <button onClick={() => selectUser(mvp.id)} className="shrink-0">
            <UserAvatar
              name={mvp.displayName}
              platform={mvp.primaryPlatform}
              size="xl"
              online={mvp.online}
              nft={isMe(mvp.id, mvp.displayName)}
              nftSrc={isMe(mvp.id, mvp.displayName) ? MY_PFP : undefined}
              className="ring-4 ring-hq/30"
            />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => selectUser(mvp.id)}
                className="text-2xl font-bold tracking-tight hover:underline"
              >
                {mvp.displayName}
              </button>
              <PlatformGlyph platform={mvp.primaryPlatform} className="h-4 w-4" />
            </div>
            <p className="text-sm text-muted-foreground">
              Lv {mvp.level} · {levelTitle(mvp.level)} · {formatNumber(mvp.totalMessages)} messages
            </p>
            <p className="mt-2 max-w-lg text-sm text-foreground/80">
              Recognized for leading the most discussions, welcoming new members and
              keeping the energy high all week long. The HQ runs on members like this. 🫧
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {mvp.badges.slice(0, 4).map((b) => (
                <BadgeChip key={b} id={b} size="sm" />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Podium */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[podium[1], podium[0], podium[2]].map((u, i) => {
          const place = u === podium[0] ? 1 : u === podium[1] ? 2 : 3;
          const mine = isMe(u.id, u.displayName);
          return (
            <button
              key={u.id}
              onClick={() => selectUser(u.id)}
              className={cn(
                "flex flex-col items-center rounded-2xl border p-4 transition-all hover:-translate-y-1",
                place === 1
                  ? "border-hq/30 bg-gradient-to-b from-hq/[0.1] to-transparent sm:-mt-4"
                  : "border-black/[0.08] bg-black/[0.02]"
              )}
            >
              <div className="relative">
                <UserAvatar
                  name={u.displayName}
                  platform={u.primaryPlatform}
                  size={place === 1 ? "lg" : "md"}
                  online={u.online}
                  nft={mine}
                  nftSrc={mine ? MY_PFP : undefined}
                />
                <span
                  className={cn(
                    "absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                    place === 1
                      ? "bg-gradient-to-br from-amber-300 to-yellow-600 text-yellow-950"
                      : place === 2
                        ? "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900"
                        : "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100"
                  )}
                >
                  {place}
                </span>
              </div>
              <p className="mt-2 max-w-full truncate text-sm font-semibold">{u.displayName}</p>
              <p className="tabular text-xs text-hq">{u.engagementScore} pts</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Full leaderboard */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-hq" />
            <h3 className="text-sm font-semibold">Top Contributors</h3>
            <span className="ml-auto text-[11px] text-muted-foreground">
              ranked by engagement score
            </span>
          </div>
          <Leaderboard limit={12} />
        </Card>

        {/* Side: your rank + levels */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-hq" />
              <h3 className="text-sm font-semibold">Your Standing</h3>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-hq/15 bg-hq/[0.04] p-3">
              <UserAvatar name={currentUser.displayName} platform="hq" size="md" online nft nftSrc={MY_PFP} />
              <div className="flex-1">
                <p className="font-semibold">{currentUser.displayName}</p>
                <p className="text-[11px] text-muted-foreground">
                  Lv {currentUser.level} · {levelTitle(currentUser.level)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground">Keep chatting to</p>
                <p className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <TrendingUp className="h-3 w-3" /> climb the board
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-hq" />
              <h3 className="text-sm font-semibold">Community Levels</h3>
            </div>
            <div className="space-y-1.5">
              {LEVEL_TIERS.map((lvl, i) => (
                <div
                  key={lvl}
                  className="flex items-center gap-3 rounded-xl border border-black/[0.05] bg-black/[0.02] px-3 py-2"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-hq/30 to-hq/5 text-[11px] font-bold text-hq">
                    {lvl}
                  </span>
                  <span className="flex-1 text-sm font-medium">{levelTitle(lvl)}</span>
                  {i === LEVEL_TIERS.length - 1 && (
                    <Crown className="h-4 w-4 text-hq" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Badge gallery */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Medal className="h-4 w-4 text-hq" />
          <h3 className="text-sm font-semibold">Activity Badges</h3>
          <span className="ml-auto text-[11px] text-muted-foreground">
            earn these by participating
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(Object.keys(BADGES) as BadgeId[]).map((id) => {
            const b = BADGES[id];
            return (
              <div
                key={id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border border-black/[0.06] bg-black/[0.02] p-3 ring-1",
                  RARITY_RING[b.rarity]
                )}
              >
                <BadgeChip id={id} showLabel={false} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{b.label}</p>
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    {b.description}
                  </p>
                  <span className="mt-1 inline-block text-[10px] font-medium uppercase tracking-wide text-hq/70">
                    {b.rarity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
