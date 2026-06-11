"use client";

import { useMemo } from "react";
import {
  ShieldCheck,
  Flag,
  VolumeX,
  EyeOff,
  Check,
  Search,
  ScrollText,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/widgets/widget";
import { Feed } from "@/components/feed/feed";
import { PlatformGlyph } from "@/components/brand/platform-icon";
import { UserAvatar } from "@/components/brand/user-avatar";
import { MessageContent } from "@/components/feed/message-content";
import { useHQ } from "@/store/hq-store";
import { cn, formatClock, relativeTime } from "@/lib/utils";
import type { Platform } from "@/lib/types";

const ACTION_STYLE: Record<string, string> = {
  mute: "text-destructive",
  unmute: "text-emerald-600",
  hide: "text-amber-600",
  flag: "text-amber-600",
  warn: "text-orange-400",
};

export default function ModerationPage() {
  const messages = useHQ((s) => s.messages);
  const mutedUsers = useHQ((s) => s.mutedUsers);
  const hiddenIds = useHQ((s) => s.hiddenIds);
  const log = useHQ((s) => s.moderationLog);
  const search = useHQ((s) => s.search);
  const setSearch = useHQ((s) => s.setSearch);
  const spamFilter = useHQ((s) => s.spamFilter);
  const toggleSpamFilter = useHQ((s) => s.toggleSpamFilter);
  const dismissFlag = useHQ((s) => s.dismissFlag);
  const hideMessage = useHQ((s) => s.hideMessage);
  const unmuteUser = useHQ((s) => s.unmuteUser);

  const flagged = useMemo(
    () => messages.filter((m) => m.flagged && !hiddenIds.includes(m.id)).slice(-8).reverse(),
    [messages, hiddenIds]
  );

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Moderation"
        description="Keep the HQ healthy. Tools for the team that protects the vibe."
        icon={<ShieldCheck className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-black/[0.02] px-3 py-2">
            <span className="text-xs text-muted-foreground">Auto spam filter</span>
            <Switch checked={spamFilter} onCheckedChange={toggleSpamFilter} />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Flagged"
          value={flagged.length}
          icon={<Flag className="h-4 w-4" />}
          accent="text-amber-600"
          sub={<span className="text-muted-foreground">awaiting review</span>}
        />
        <StatTile
          label="Muted Users"
          value={mutedUsers.length}
          icon={<VolumeX className="h-4 w-4" />}
          accent="text-destructive"
          sub={<span className="text-muted-foreground">currently silenced</span>}
        />
        <StatTile
          label="Hidden"
          value={hiddenIds.length}
          icon={<EyeOff className="h-4 w-4" />}
          sub={<span className="text-muted-foreground">removed messages</span>}
        />
        <StatTile
          label="Spam Blocked"
          value="1,284"
          icon={<ShieldCheck className="h-4 w-4" />}
          accent="text-emerald-600"
          sub={<span className="text-emerald-600">all-time</span>}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Moderator feed */}
        <Card className="flex h-[600px] flex-col overflow-hidden lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-black/[0.06] p-3">
            <ShieldCheck className="h-4 w-4 text-hq" />
            <span className="text-sm font-semibold">Live Moderation View</span>
            <div className="relative ml-auto w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search history…"
                className="h-9 pl-9 text-xs"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <Feed showHeader={false} showComposer={false} dense />
          </div>
          <p className="border-t border-black/[0.06] px-3 py-2 text-[11px] text-muted-foreground">
            Hover any message to flag, hide, or mute the sender.
          </p>
        </Card>

        {/* Side: flagged + muted */}
        <div className="space-y-6">
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Flag className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-semibold">Flagged for Review</h3>
              <span className="ml-auto rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                {flagged.length}
              </span>
            </div>
            {flagged.length === 0 ? (
              <p className="rounded-xl border border-black/[0.05] bg-black/[0.02] p-4 text-center text-xs text-muted-foreground">
                Nothing flagged. The room is clean. ✨
              </p>
            ) : (
              <div className="space-y-2">
                {flagged.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-3"
                  >
                    <div className="mb-1 flex items-center gap-1.5 text-xs">
                      <PlatformGlyph platform={m.platform} className="h-3 w-3" />
                      <span className="font-semibold">{m.displayName}</span>
                      <span className="tabular ml-auto text-[10px] text-muted-foreground">
                        {formatClock(m.timestamp)}
                      </span>
                    </div>
                    <p className="text-[13px] text-foreground/80">
                      <MessageContent text={m.content} />
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 flex-1 text-xs"
                        onClick={() => dismissFlag(m.id)}
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 flex-1 text-xs"
                        onClick={() => hideMessage(m.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <VolumeX className="h-4 w-4 text-destructive" />
              <h3 className="text-sm font-semibold">Muted Users</h3>
            </div>
            {mutedUsers.length === 0 ? (
              <p className="rounded-xl border border-black/[0.05] bg-black/[0.02] p-4 text-center text-xs text-muted-foreground">
                No muted users.
              </p>
            ) : (
              <div className="space-y-1.5">
                {mutedUsers.map((u) => (
                  <div
                    key={u}
                    className="flex items-center gap-2.5 rounded-xl border border-black/[0.06] bg-black/[0.02] p-2"
                  >
                    <UserAvatar name={u} size="sm" ring={false} />
                    <span className="flex-1 truncate text-sm font-medium">{u}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => unmuteUser(u)}
                    >
                      Unmute
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Moderation log */}
      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-hq" />
          <h3 className="text-sm font-semibold">Moderation Log</h3>
        </div>
        {log.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No actions yet this session. Actions you take will be recorded here.
          </p>
        ) : (
          <div className="space-y-1">
            {log.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-black/[0.02]"
              >
                <span
                  className={cn(
                    "w-16 text-[11px] font-bold uppercase tracking-wide",
                    ACTION_STYLE[e.action] ?? "text-muted-foreground"
                  )}
                >
                  {e.action}
                </span>
                <PlatformGlyph platform={e.platform as Platform} className="h-3.5 w-3.5" />
                <span className="font-medium">{e.targetUser}</span>
                <span className="text-muted-foreground">— {e.reason}</span>
                <span className="tabular ml-auto text-[11px] text-muted-foreground">
                  {relativeTime(e.timestamp)} · by {e.moderator}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
