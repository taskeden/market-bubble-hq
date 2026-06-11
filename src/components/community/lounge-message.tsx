"use client";

import { BadgeCheck, EyeOff, Heart, Reply, SmilePlus } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { HOSTS, PLATFORMS, ROLE_META } from "@/lib/config";
import { cn, formatClock } from "@/lib/utils";
import { PlatformGlyph } from "@/components/brand/platform-icon";
import { HostAvatar } from "@/components/brand/host-avatar";
import { UserAvatar } from "@/components/brand/user-avatar";
import { MessageContent } from "@/components/feed/message-content";
import { useHQ } from "@/store/hq-store";

// ─── Discord-style lounge messages — fully branded (theme-aware) ──────────────
// Big, hangout-scale rendering on the site's own cardstock theme, so it reads on
// the light desk AND flips with the dark-mode toggle (no forced obsidian). 40px
// nft avatars, a name header, then the author's grouped run underneath.

function nameColor(m: ChatMessage): string {
  // X has no light hue — read it as plain ink (flips to white on dark).
  return m.platform === "x" ? "text-foreground" : PLATFORMS[m.platform].text;
}

/** Hover row actions — quiet, Discord-style (react · reply · hide). */
function LineActions({ id, onHide }: { id: string; onHide: (id: string) => void }) {
  return (
    <div className="absolute -top-3.5 right-2 hidden items-center gap-0.5 rounded-lg border border-black/[0.07] bg-popover p-0.5 shadow-md group-hover/line:flex">
      <button
        title="React"
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-black/[0.05] hover:text-foreground"
      >
        <SmilePlus className="h-3.5 w-3.5" />
      </button>
      <button
        title="Reply"
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-black/[0.05] hover:text-foreground"
      >
        <Reply className="h-3.5 w-3.5" />
      </button>
      <button
        title="Hide"
        onClick={() => onHide(id)}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-black/[0.05] hover:text-destructive"
      >
        <EyeOff className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** A single chat line inside a group. */
function Line({ m, onHide }: { m: ChatMessage; onHide: (id: string) => void }) {
  return (
    <div
      className={cn(
        "group/line relative -mx-2 rounded-md px-2 py-px transition-colors hover:bg-black/[0.03]",
        m.flagged && "bg-destructive/[0.06]"
      )}
    >
      <p className="break-words text-[13.5px] leading-[1.5] text-foreground/90">
        <MessageContent text={m.content} />
        {(m.reactions ?? 0) > 0 && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-black/[0.06] bg-black/[0.03] px-1.5 py-px align-[1px] text-[10px] font-medium text-muted-foreground">
            <Heart className="h-2.5 w-2.5 fill-rose-500 text-rose-500" /> {m.reactions}
          </span>
        )}
      </p>
      <LineActions id={m.id} onHide={onHide} />
    </div>
  );
}

/** A host's own X post — a standalone tweet card in the flow. */
function LoungeTweet({ m, onHide }: { m: ChatMessage; onHide: (id: string) => void }) {
  const selectUser = useHQ((s) => s.selectUser);
  return (
    <div className="px-4 pt-3.5">
      <div className="group/line relative max-w-[660px] rounded-xl border border-black/[0.07] bg-card/70 p-3.5 shadow-sm">
        <div className="flex items-start gap-2.5">
          <HostAvatar host={m.source} className="h-9 w-9 text-[13px]" markClassName="h-5 w-5" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 leading-none">
              <button
                onClick={() => selectUser(m.userId)}
                className={cn("text-[13px] font-bold hover:underline", HOSTS[m.source].accent)}
              >
                {m.displayName}
              </button>
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-500" />
              <span className="truncate text-[11px] text-muted-foreground">@{m.username}</span>
              <PlatformGlyph platform="x" inherit className="ml-auto h-3.5 w-3.5 shrink-0 text-foreground/70" />
            </div>
            <p className="mt-1.5 break-words text-[13.5px] leading-relaxed text-foreground/90">
              <MessageContent text={m.content} />
            </p>
            <div className="mt-2.5 flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3 fill-rose-500 text-rose-500" /> {m.reactions}
              </span>
              <span className="tabular">{formatClock(m.timestamp)}</span>
            </div>
          </div>
        </div>
        <LineActions id={m.id} onHide={onHide} />
      </div>
    </div>
  );
}

/** A grouped run of messages from one author (or a standalone tweet card). */
export function LoungeGroup({
  items,
  onHide,
}: {
  items: ChatMessage[];
  onHide: (id: string) => void;
}) {
  const selectUser = useHQ((s) => s.selectUser);
  const first = items[0];

  if (first.kind === "tweet") return <LoungeTweet m={first} onHide={onHide} />;

  const role = ROLE_META[first.role];
  const showRole = first.role !== "member" && first.role !== "bot";
  const color = nameColor(first);

  return (
    <div className="group/msg flex gap-3 px-4 pt-3.5 transition-colors hover:bg-black/[0.015]">
      <button
        onClick={() => selectUser(first.userId)}
        className="mt-0.5 shrink-0 transition-opacity hover:opacity-80"
        aria-label={`${first.displayName} profile`}
      >
        <UserAvatar name={first.displayName} size="md" nft ring={false} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <button
            onClick={() => selectUser(first.userId)}
            className={cn("text-[14px] font-semibold leading-none hover:underline", color)}
          >
            {first.displayName}
          </button>
          <PlatformGlyph platform={first.platform} className="h-3 w-3 shrink-0 self-center" />
          {showRole && (
            <span
              className={cn(
                "self-center rounded-[3px] bg-black/[0.05] px-1 py-px text-[8.5px] font-bold uppercase leading-none tracking-wide",
                role.class
              )}
            >
              {role.label}
            </span>
          )}
          {first.platform === "hq" && first.role === "member" && (
            <span className="self-center rounded-[3px] bg-gold/15 px-1 py-px text-[8.5px] font-bold uppercase leading-none tracking-wide text-gold">
              HQ
            </span>
          )}
          <span className="tabular text-[10px] text-muted-foreground/70">
            {formatClock(first.timestamp)}
          </span>
        </div>

        <div className="mt-1">
          {items.map((m) => (
            <Line key={m.id} m={m} onHide={onHide} />
          ))}
        </div>
      </div>
    </div>
  );
}
