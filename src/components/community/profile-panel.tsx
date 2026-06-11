"use client";

import { useMemo } from "react";
import {
  MessageSquare,
  Flame,
  Trophy,
  CalendarDays,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useHQ } from "@/store/hq-store";
import { PLATFORMS, ROLE_META, levelTitle } from "@/lib/config";
import { UserAvatar } from "@/components/brand/user-avatar";
import { isMe, MY_PFP } from "@/lib/data/nft-pfp";
import { PlatformIcon } from "@/components/brand/platform-icon";
import { BadgeChip } from "./badge-chip";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MessageContent } from "@/components/feed/message-content";
import {
  cn,
  formatClock,
  formatMonthYear,
  formatNumber,
  relativeTime,
} from "@/lib/utils";

function ScoreRing({ value }: { value: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative h-20 w-20">
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="hsl(var(--hq))"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-lg font-bold leading-none">{value}</span>
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
          score
        </span>
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1 text-lg font-bold tracking-tight">{value}</div>
    </div>
  );
}

export function ProfilePanel() {
  const selectedUserId = useHQ((s) => s.selectedUserId);
  const selectUser = useHQ((s) => s.selectUser);
  const resolveUser = useHQ((s) => s.resolveUser);
  const messages = useHQ((s) => s.messages);

  const user = selectedUserId ? resolveUser(selectedUserId) : undefined;

  const recent = useMemo(
    () =>
      messages
        .filter((m) => m.userId === selectedUserId && m.kind === "chat")
        .slice(-5)
        .reverse(),
    [messages, selectedUserId]
  );

  const role = user ? ROLE_META[user.role] : null;

  return (
    <Sheet open={!!user} onOpenChange={(o) => !o && selectUser(null)}>
      <SheetContent side="right" className="overflow-y-auto p-0">
        {user && (
          <div>
            {/* Hero */}
            <div className="relative overflow-hidden border-b border-black/[0.06] p-5">
              <div
                className="absolute inset-0 -z-10 opacity-40"
                style={{
                  background: `radial-gradient(120% 80% at 0% 0%, hsl(${PLATFORMS[user.primaryPlatform].hsl} / 0.25), transparent 60%)`,
                }}
              />
              <div className="flex items-start gap-4">
                <UserAvatar
                  name={user.displayName}
                  platform={user.primaryPlatform}
                  size="xl"
                  online={user.online}
                  nft={isMe(user.id, user.displayName)}
                  nftSrc={isMe(user.id, user.displayName) ? MY_PFP : undefined}
                />
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-xl font-bold tracking-tight">
                      {user.displayName}
                    </h2>
                    {role && user.role !== "member" && (
                      <span
                        className={cn(
                          "rounded-md bg-black/[0.08] px-1.5 py-0.5 text-[10px] font-bold uppercase",
                          role.class
                        )}
                      >
                        {role.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="rounded-full bg-hq/15 px-2 py-0.5 text-[11px] font-semibold text-hq">
                      Lv {user.level} · {levelTitle(user.level)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          user.online ? "bg-emerald-400" : "bg-muted-foreground/50"
                        )}
                      />
                      {user.online ? "online" : `seen ${relativeTime(user.lastActive)}`}
                    </span>
                  </div>
                </div>
                <ScoreRing value={user.engagementScore} />
              </div>

              {user.bio && (
                <p className="mt-4 text-sm text-foreground/80">{user.bio}</p>
              )}

              {/* Level progress */}
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Level {user.level} progress</span>
                  <span className="tabular">
                    {user.xp} / {user.xpToNext} XP
                  </span>
                </div>
                <Progress
                  value={(user.xp / user.xpToNext) * 100}
                  indicatorClassName="bg-gradient-to-r from-hq to-hq/50"
                />
              </div>
            </div>

            <div className="space-y-5 p-5">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <MiniStat
                  icon={<MessageSquare className="h-3.5 w-3.5" />}
                  label="Messages"
                  value={formatNumber(user.totalMessages)}
                />
                <MiniStat
                  icon={<Trophy className="h-3.5 w-3.5" />}
                  label="Rank"
                  value={`#${user.rank}`}
                />
                <MiniStat
                  icon={<Flame className="h-3.5 w-3.5" />}
                  label="Streak"
                  value={`${user.streak}d`}
                />
                <MiniStat
                  icon={<TrendingUp className="h-3.5 w-3.5" />}
                  label="Engagement"
                  value={`${user.engagementScore}/100`}
                />
              </div>

              {/* Platforms */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Active on
                </p>
                <div className="flex flex-wrap gap-2">
                  {user.platforms.map((p) => (
                    <div
                      key={p}
                      className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-black/[0.02] px-2.5 py-1.5"
                    >
                      <PlatformIcon platform={p} size="sm" />
                      <span className="text-xs font-medium">{PLATFORMS[p].label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges */}
              {user.badges.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Achievements
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.badges.map((b) => (
                      <BadgeChip key={b} id={b} size="sm" />
                    ))}
                  </div>
                </div>
              )}

              {/* Favorite topics */}
              {user.favoriteTopics.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Favorite topics
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.favoriteTopics.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-black/[0.08] bg-black/[0.03] px-2.5 py-1 text-xs text-foreground/80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent activity */}
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="h-3 w-3" /> Recent activity
                </p>
                {recent.length > 0 ? (
                  <div className="space-y-2">
                    {recent.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-xl border border-black/[0.05] bg-black/[0.02] p-2.5"
                      >
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <PlatformIcon platform={m.platform} size="sm" />
                          <span className="tabular">{formatClock(m.timestamp)}</span>
                        </div>
                        <p className="text-[13px] text-foreground/85">
                          <MessageContent text={m.content} />
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-black/[0.05] bg-black/[0.02] p-3 text-center text-xs text-muted-foreground">
                    No messages in this session yet.
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-black/[0.06] pt-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Joined {formatMonthYear(user.joinDate)}
                </span>
                <Button size="sm" variant="bubble">
                  <Sparkles className="h-3.5 w-3.5" /> Follow
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
