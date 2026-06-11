"use client";

import { useMemo, useState } from "react";
import { useHQ } from "@/store/hq-store";
import { useLiveStatus, STATUS_META } from "@/lib/data/live-status";
import { HOSTS, HOST_ORDER, PLATFORMS } from "@/lib/config";
import type { ChatMessage, HostId, Platform } from "@/lib/types";
import { HostAvatar } from "@/components/brand/host-avatar";
import { UserAvatar } from "@/components/brand/user-avatar";
import { BubblesAvatar } from "@/components/brand/bubbles-avatar";
import { PlatformGlyph } from "@/components/brand/platform-icon";
import { BubblesPanel } from "@/components/bubbles/bubbles-panel";
import { cn } from "@/lib/utils";

// ─── Discord's member list, branded (theme-aware) ─────────────────────────────
// Hosts (with their room's live status) · Bubbles the AI co-host · everyone
// who's actually talking in the lounge buffer ("on the floor"). A second tab
// swaps the rail for the full Bubbles insight panel.

/** Which adapter carries each host's main room (drives their presence dot). */
const HOST_ROOM: Record<HostId, Platform> = {
  ansem: "kick",
  banks: "twitch",
  marketbubble: "youtube",
};

interface Speaker {
  m: ChatMessage;
  count: number;
}

function speakerColor(p: Platform): string {
  return p === "x" ? "text-foreground/85" : PLATFORMS[p].text;
}

function MembersList({ messages }: { messages: ChatMessage[] }) {
  const selectUser = useHQ((s) => s.selectUser);
  const status = useLiveStatus((s) => s.status);

  const speakers = useMemo(() => {
    const map = new Map<string, Speaker>();
    for (const m of messages) {
      if (m.kind !== "chat") continue;
      const e = map.get(m.userId);
      if (e) {
        e.count += 1;
        e.m = m;
      } else {
        map.set(m.userId, { m, count: 1 });
      }
    }
    return [...map.values()]
      .sort((a, b) => b.count - a.count || b.m.timestamp - a.m.timestamp)
      .slice(0, 50);
  }, [messages]);

  return (
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-2.5 py-3">
      {/* Hosts */}
      <section>
        <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
          Hosts — {HOST_ORDER.length}
        </p>
        <div className="space-y-0.5">
          {HOST_ORDER.map((id) => {
            const host = HOSTS[id];
            const st = status[HOST_ROOM[id]];
            const meta = st ? STATUS_META[st] : undefined;
            const live = st === "connected";
            return (
              <div key={id} className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
                <div className="relative">
                  <HostAvatar host={id} className="h-8 w-8 text-[12px]" markClassName="h-4 w-4" />
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                      live ? "bg-emerald-500" : "bg-muted-foreground/40"
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-[12.5px] font-semibold leading-tight", host.accent)}>
                    {host.label}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground/70">@{host.handle}</p>
                </div>
                {live && meta && (
                  <span className="rounded-[3px] bg-hq/12 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-hq">
                    Live
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bubbles */}
      <section>
        <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
          AI Co-host — 1
        </p>
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
          <div className="relative">
            <BubblesAvatar size={32} pulse={false} />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold leading-tight text-bubble">Bubbles</p>
            <p className="truncate text-[10px] text-muted-foreground/70">always on the floor</p>
          </div>
        </div>
      </section>

      {/* Everyone actually talking */}
      <section>
        <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
          On the floor — {speakers.length}
        </p>
        {speakers.length === 0 ? (
          <p className="px-2 py-2 text-[11px] text-muted-foreground/60">
            Warming up — the room&rsquo;s about to fill.
          </p>
        ) : (
          <div className="space-y-0.5">
            {speakers.map(({ m, count }) => (
              <button
                key={m.userId}
                onClick={() => selectUser(m.userId)}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-left transition-colors hover:bg-black/[0.04]"
              >
                <UserAvatar name={m.displayName} size="sm" nft ring={false} />
                <p className={cn("min-w-0 flex-1 truncate text-[12.5px] font-medium", speakerColor(m.platform))}>
                  {m.displayName}
                </p>
                <PlatformGlyph platform={m.platform} className="h-3 w-3 shrink-0 opacity-70" />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function MemberRail({ messages }: { messages: ChatMessage[] }) {
  const [tab, setTab] = useState<"members" | "bubbles">("members");

  return (
    <aside className="cardstock hidden w-[252px] shrink-0 flex-col border-l border-black/[0.07] xl:flex">
      <div className="flex gap-1 border-b border-black/[0.06] p-2">
        {(["members", "bubbles"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-md py-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] transition-colors",
              tab === t
                ? "bg-black/[0.06] text-foreground"
                : "text-muted-foreground hover:bg-black/[0.04] hover:text-foreground"
            )}
          >
            {t === "members" ? "Members" : "Bubbles"}
          </button>
        ))}
      </div>

      {tab === "members" ? (
        <MembersList messages={messages} />
      ) : (
        <div className="min-h-0 flex-1">
          <BubblesPanel />
        </div>
      )}
    </aside>
  );
}
