"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { useHQ } from "@/store/hq-store";
import { selectTerminalMessages, useTerminal } from "@/store/terminal-store";

/**
 * The terminal feed's data source, with pause + slow mode layered on top of
 * the live pipeline WITHOUT touching the global sim (`running`) — the 340px
 * stream chat and the rest of the site keep flowing while the terminal holds.
 *
 * Mechanics: one hq-store subscription, memoized filtering; intervals read the
 * live list through a ref (never stale, never a dependency); pause captures a
 * snapshot once on flip; slow mode samples every N seconds. The buffered count
 * compares timestamps, not lengths — the 220-cap slides during long holds, so
 * length deltas would lie.
 */
export function useTerminalFeed(): {
  messages: ChatMessage[];
  buffered: number;
  frozen: boolean;
} {
  const raw = useHQ((s) => s.messages);
  const hiddenIds = useHQ((s) => s.hiddenIds);

  const sources = useTerminal((s) => s.sources);
  const tickerFilter = useTerminal((s) => s.tickerFilter);
  const questionsOnly = useTerminal((s) => s.questionsOnly);
  const highSignalOnly = useTerminal((s) => s.highSignalOnly);
  const modsOnly = useTerminal((s) => s.modsOnly);
  const search = useTerminal((s) => s.search);
  const broadcastMode = useTerminal((s) => s.broadcastMode);
  const paused = useTerminal((s) => s.paused);
  const slowMode = useTerminal((s) => s.slowMode);

  const live = useMemo(
    () =>
      selectTerminalMessages(raw, hiddenIds, {
        sources,
        tickerFilter,
        questionsOnly,
        highSignalOnly,
        modsOnly,
        search,
        broadcastMode,
      }),
    [raw, hiddenIds, sources, tickerFilter, questionsOnly, highSignalOnly, modsOnly, search, broadcastMode]
  );

  const liveRef = useRef(live);
  liveRef.current = live;

  const [snapshot, setSnapshot] = useState<ChatMessage[]>([]);

  // Pause: freeze what's on screen the moment the operator hits hold.
  useEffect(() => {
    if (paused) setSnapshot(liveRef.current);
  }, [paused]);

  // Slow mode: release the feed in measured beats while not paused.
  useEffect(() => {
    if (paused || slowMode === 0) return;
    setSnapshot(liveRef.current);
    const id = setInterval(() => setSnapshot(liveRef.current), slowMode * 1000);
    return () => clearInterval(id);
  }, [slowMode, paused]);

  const passthrough = !paused && slowMode === 0;
  const messages = passthrough ? live : snapshot;
  const lastTs = messages.length ? messages[messages.length - 1].timestamp : 0;
  const buffered = passthrough
    ? 0
    : live.reduce((n, m) => (m.timestamp > lastTs ? n + 1 : n), 0);

  return { messages, buffered, frozen: paused };
}
