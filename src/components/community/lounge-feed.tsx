"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, Hash, Search, Users } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { Composer } from "@/components/feed/composer";
import { cn } from "@/lib/utils";
import { LoungeGroup } from "./lounge-message";
import type { LoungeChannel } from "./lounge-channels";

// ─── Feed rows: author groups + date dividers ─────────────────────────────────

type FeedRow =
  | { type: "divider"; id: string; label: string }
  | { type: "group"; id: string; items: ChatMessage[] };

const GROUP_WINDOW_MS = 5 * 60_000;

function dayLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function buildRows(messages: ChatMessage[]): FeedRow[] {
  const rows: FeedRow[] = [];
  let group: ChatMessage[] | null = null;
  let last: ChatMessage | null = null;
  let lastDay = "";

  for (const m of messages) {
    const day = new Date(m.timestamp).toDateString();
    if (day !== lastDay) {
      rows.push({ type: "divider", id: `day-${day}`, label: dayLabel(m.timestamp) });
      lastDay = day;
      last = null; // a divider always breaks the group chain
    }
    const chains =
      last !== null &&
      group !== null &&
      m.kind === "chat" &&
      last.kind === "chat" &&
      last.userId === m.userId &&
      last.platform === m.platform &&
      m.timestamp - last.timestamp < GROUP_WINDOW_MS;

    if (chains) {
      group!.push(m);
    } else {
      group = [m];
      rows.push({ type: "group", id: m.id, items: group });
    }
    last = m;
  }
  return rows;
}

// ─── Welcome hero at the top of the room (Discord's channel intro) ────────────

function WelcomeBlock({ channel }: { channel: LoungeChannel }) {
  return (
    <div className="px-4 pb-2 pt-7">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-hq/15 to-gold/10 ring-1 ring-black/[0.06]">
        <Hash className="h-7 w-7 text-hq" />
      </span>
      <h2 className="mt-3 font-display text-[24px] font-bold tracking-tight text-foreground">
        Welcome to #{channel.name}
      </h2>
      <p className="mt-1 max-w-[560px] text-[13px] leading-relaxed text-muted-foreground">
        {channel.welcome}
      </p>
      {channel.hand && (
        <p className="font-hand mt-2 text-[22px] leading-none text-hq">{channel.hand}</p>
      )}
    </div>
  );
}

// ─── The lounge feed: header · scroller · composer ────────────────────────────

export function LoungeFeed({
  channel,
  messages,
  onHide,
  query,
  onQuery,
  showMembers,
  onToggleMembers,
}: {
  channel: LoungeChannel;
  messages: ChatMessage[];
  onHide: (id: string) => void;
  query: string;
  onQuery: (q: string) => void;
  showMembers: boolean;
  onToggleMembers: () => void;
}) {
  const rows = useMemo(() => buildRows(messages), [messages]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  // Track the tail by message id, not length: the per-channel buffer caps and
  // slides, so a length delta would freeze auto-follow once a channel fills.
  const lastSeenIdRef = useRef<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [newCount, setNewCount] = useState(0);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setNewCount(0);
    setAtBottom(true);
    atBottomRef.current = true;
  };

  // Pin to bottom on mount and whenever the channel changes. Prime the tail ref
  // to the new channel's last message so the follow effect below doesn't
  // re-scroll redundantly right after the switch.
  useEffect(() => {
    lastSeenIdRef.current = messages.length ? messages[messages.length - 1].id : null;
    scrollToBottom("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.id]);

  // Follow new messages with an instant jump (smooth lags behind chat bursts
  // and de-sticks auto-follow — same hard-won logic as the small Feed). Keyed
  // on the tail message id so it still fires when the capped buffer holds the
  // length constant.
  useEffect(() => {
    const lastId = messages.length ? messages[messages.length - 1].id : null;
    if (lastId === lastSeenIdRef.current) return; // tail unchanged — nothing new
    let added = 1;
    if (lastSeenIdRef.current) {
      const idx = messages.findIndex((m) => m.id === lastSeenIdRef.current);
      added = idx === -1 ? messages.length : messages.length - 1 - idx;
    }
    lastSeenIdRef.current = lastId;
    if (added <= 0) return;
    if (atBottomRef.current) {
      scrollToBottom("auto");
    } else {
      setNewCount((c) => c + added);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleScroll = () => {
    const el = viewportRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    const bottom = dist < 80;
    atBottomRef.current = bottom;
    setAtBottom(bottom);
    if (bottom) setNewCount(0);
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-card/30">
      {/* ── Room header ── */}
      <div className="flex items-center gap-3 border-b border-black/[0.06] bg-card/50 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <Hash className="h-4 w-4 text-hq" />
          <h1 className="font-display text-[16px] font-bold leading-none text-foreground">
            {channel.name}
          </h1>
        </div>
        <div className="hidden h-4 w-px shrink-0 bg-black/10 md:block" />
        <p className="hidden min-w-0 flex-1 truncate text-[12px] text-muted-foreground md:block">
          {channel.topic}
        </p>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="tabular hidden items-center gap-1.5 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            live
          </span>
          <label className="flex h-7 items-center gap-1.5 rounded-md border border-black/[0.08] bg-black/[0.03] px-2 transition-colors focus-within:border-hq/40">
            <Search className="h-3 w-3 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search"
              className="w-24 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/60 md:w-36"
            />
          </label>
          <button
            onClick={onToggleMembers}
            title={showMembers ? "Hide members" : "Show members"}
            className={cn(
              "hidden h-7 w-7 items-center justify-center rounded-md transition-colors xl:flex",
              showMembers
                ? "bg-black/[0.06] text-foreground"
                : "text-muted-foreground hover:bg-black/[0.04] hover:text-foreground"
            )}
          >
            <Users className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={viewportRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto pb-4"
        >
          <div className="mx-auto max-w-[1040px]">
            <WelcomeBlock channel={channel} />

            {messages.length === 0 && query && (
              <p className="px-4 pt-6 text-[13px] text-muted-foreground">
                Nothing in #{channel.name} matches your search.
              </p>
            )}

            {rows.map((row) =>
              row.type === "divider" ? (
                <div key={row.id} className="flex items-center gap-3 px-4 pt-5">
                  <span className="h-px flex-1 bg-black/[0.07]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                    {row.label}
                  </span>
                  <span className="h-px flex-1 bg-black/[0.07]" />
                </div>
              ) : (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                >
                  <LoungeGroup items={row.items} onHide={onHide} />
                </motion.div>
              )
            )}
          </div>
        </div>

        {/* New-messages pill */}
        {!atBottom && newCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-hq/30 bg-hq px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-hq/90"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            {newCount} new message{newCount > 1 ? "s" : ""}
          </motion.button>
        )}
      </div>

      {/* ── Composer ── */}
      <Composer placeholder={`Message #${channel.name}`} />
    </div>
  );
}
