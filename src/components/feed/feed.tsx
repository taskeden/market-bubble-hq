"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, MessagesSquare } from "lucide-react";
import { useHQ } from "@/store/hq-store";
import type { ChatMessage } from "@/lib/types";
import { DATA_MODE } from "@/lib/config";
import { MessageRow } from "./message-row";
import { Composer } from "./composer";
import { PlatformFilter } from "./platform-filter";
import { cn } from "@/lib/utils";

function isSpam(text: string): boolean {
  return (
    /(.)\1{6,}/.test(text) || // long character runs
    /(https?:\/\/|www\.)/i.test(text) || // links
    /\b(free|airdrop|giveaway|dm me|follow\s?4\s?follow)\b/i.test(text)
  );
}

function filterMessages(
  messages: ChatMessage[],
  platforms: Record<string, boolean>,
  search: string,
  hiddenIds: string[],
  spamFilter: boolean
): ChatMessage[] {
  const q = search.trim().toLowerCase();
  const hidden = new Set(hiddenIds);
  return messages.filter((m) => {
    if (!platforms[m.platform]) return false;
    if (hidden.has(m.id) || m.hidden) return false;
    if (spamFilter && isSpam(m.content)) return false;
    if (q && !(m.content.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q)))
      return false;
    return true;
  });
}

export function Feed({
  showComposer = true,
  showHeader = true,
  dense = false,
  overlay = false,
  className,
}: {
  showComposer?: boolean;
  showHeader?: boolean;
  dense?: boolean;
  /** Translucent-over-video styling (light text), enabled at lg+. */
  overlay?: boolean;
  className?: string;
}) {
  const messages = useHQ((s) => s.messages);
  const filterPlatforms = useHQ((s) => s.filterPlatforms);
  const search = useHQ((s) => s.search);
  const hiddenIds = useHQ((s) => s.hiddenIds);
  const spamFilter = useHQ((s) => s.spamFilter);

  const visible = useMemo(
    () => filterMessages(messages, filterPlatforms, search, hiddenIds, spamFilter),
    [messages, filterPlatforms, search, hiddenIds, spamFilter]
  );

  const viewportRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  // Track the tail by message id, not by length: the buffer caps at 220 and
  // slides, so once it's full the length plateaus while content keeps arriving.
  // Gating auto-follow on a length delta would freeze the feed at the cap.
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

  // Initial pin to bottom.
  useEffect(() => {
    scrollToBottom("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to new messages — keyed on the tail message id so it still fires when
  // the capped buffer holds the length constant.
  useEffect(() => {
    const lastId = visible.length ? visible[visible.length - 1].id : null;
    if (lastId === lastSeenIdRef.current) return; // tail unchanged — nothing new
    // How many messages landed past the one we last handled.
    let added = 1;
    if (lastSeenIdRef.current) {
      const idx = visible.findIndex((m) => m.id === lastSeenIdRef.current);
      added = idx === -1 ? visible.length : visible.length - 1 - idx;
    }
    lastSeenIdRef.current = lastId;
    if (added <= 0) return;
    if (atBottomRef.current) {
      // Follow with an INSTANT jump, not smooth: chat arrives in bursts, and a
      // smooth animation lags behind the growing content — its mid-flight
      // position reads as "scrolled up" and auto-follow de-sticks. An instant
      // jump always lands exactly at the bottom, so following stays locked.
      // Call directly (not via rAF) — the effect already runs after layout, so
      // scrollHeight is final, and rAF is throttled when the tab isn't focused.
      scrollToBottom("auto");
    } else {
      setNewCount((c) => c + added);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

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
    <div className={cn("flex h-full flex-col", className)}>
      {showHeader && (
        <div className="flex flex-col gap-3 border-b border-black/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-4 w-[3px] rounded-full bg-hq" />
            <MessagesSquare className="h-4 w-4 text-hq" />
            <h2 className="font-display text-[16px] font-bold tracking-tight">
              The Unified Feed
            </h2>
            <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[11px] text-muted-foreground">
              {visible.length} live
            </span>
          </div>
          <PlatformFilter />
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <div
          ref={viewportRef}
          onScroll={handleScroll}
          className={cn(
            "absolute inset-0 overflow-y-auto px-2 py-2",
            // Cinematic top-fade: messages dissolve into the stream near the top
            // (overlay only — the standalone feed/live views stay un-masked).
            overlay &&
              "lg:[mask-image:linear-gradient(to_bottom,transparent_0%,#000_18%)] lg:[-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,#000_18%)]"
          )}
        >
          {visible.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
              <MessagesSquare className="h-8 w-8 opacity-40" />
              {DATA_MODE === "live" && messages.length === 0 ? (
                <>
                  <p className="text-sm">Listening to the real rooms.</p>
                  <p className="text-[11px] opacity-70">
                    Live-only feed — it moves when someone actually chats.
                  </p>
                </>
              ) : (
                <p className="text-sm">No messages match your filters.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {visible.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <MessageRow message={m} dense={dense} overlay={overlay} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* New-messages pill */}
        {!atBottom && newCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-hq/30 bg-hq/15 px-3 py-1.5 text-xs font-semibold text-hq shadow-lg backdrop-blur-md transition-colors hover:bg-hq/25"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            {newCount} new message{newCount > 1 ? "s" : ""}
          </motion.button>
        )}
      </div>

      {showComposer && <Composer overlay={overlay} />}
    </div>
  );
}
