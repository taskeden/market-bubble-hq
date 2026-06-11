import { create } from "zustand";
import type { ChatMessage } from "@/lib/types";
import { SOURCE_PAIRS, type SourceKey } from "@/lib/config";
import { isHighSignal, isQuestion, isSpamLike } from "@/lib/data/signals";

// ─── Chat Terminal — control-plane store ─────────────────────────────────────
// Fully independent of hq-store: the terminal's filters must never bleed into
// the small stream chat or the Community page. Holds NO live message arrays
// (those flow straight from hq-store through `selectTerminalMessages`) — only
// pin/queue snapshots, which must be full copies because the hq buffer caps at
// 220 messages and evicts ids within minutes.

export type SlowMode = 0 | 2 | 5 | 10;

export const SLOW_MODES: SlowMode[] = [0, 2, 5, 10];

const MAX_QUEUE = 8;

function allSources(on: boolean): Record<SourceKey, boolean> {
  return Object.fromEntries(SOURCE_PAIRS.map((p) => [p.key, on])) as Record<SourceKey, boolean>;
}

/** The filter fields `selectTerminalMessages` consumes. */
export interface TerminalFilters {
  sources: Record<SourceKey, boolean>;
  tickerFilter: string | null;
  questionsOnly: boolean;
  highSignalOnly: boolean;
  modsOnly: boolean;
  search: string;
  broadcastMode: boolean;
}

interface TerminalState extends TerminalFilters {
  open: boolean;
  paused: boolean;
  slowMode: SlowMode;
  /** Side-rail collapse — the operator can minimize either rail to widen the feed. */
  matrixCollapsed: boolean;
  railCollapsed: boolean;
  /** Full snapshots — see module note on the 220-cap eviction. */
  pinned: ChatMessage | null;
  queue: ChatMessage[];

  openTerminal: () => void;
  closeTerminal: () => void;
  toggleBroadcast: () => void;
  toggleMatrix: () => void;
  toggleRail: () => void;
  setPaused: (v: boolean) => void;
  setSlowMode: (s: SlowMode) => void;
  setSearch: (q: string) => void;
  toggleSource: (key: SourceKey) => void;
  /** Solo a source: only this one stays on. */
  soloSource: (key: SourceKey) => void;
  setAllSources: (on: boolean) => void;
  setTickerFilter: (t: string | null) => void;
  toggleQuestionsOnly: () => void;
  toggleHighSignal: () => void;
  toggleModsOnly: () => void;
  pin: (m: ChatMessage) => void;
  unpin: () => void;
  enqueue: (m: ChatMessage) => void;
  dequeue: (id: string) => void;
  /** Move a queued message to the front (ON AIR slot). */
  promote: (id: string) => void;
  clearQueue: () => void;
  resetFilters: () => void;
}

export const useTerminal = create<TerminalState>((set) => ({
  open: false,
  broadcastMode: false,
  paused: false,
  slowMode: 0,
  matrixCollapsed: false,
  railCollapsed: false,
  search: "",
  sources: allSources(true),
  tickerFilter: null,
  questionsOnly: false,
  highSignalOnly: false,
  modsOnly: false,
  pinned: null,
  queue: [],

  // Opening/closing intentionally leaves filters intact — an operator returns
  // to the desk exactly as they left it mid-show.
  openTerminal: () => set({ open: true }),
  closeTerminal: () => set({ open: false, broadcastMode: false }),
  toggleBroadcast: () => set((s) => ({ broadcastMode: !s.broadcastMode })),
  toggleMatrix: () => set((s) => ({ matrixCollapsed: !s.matrixCollapsed })),
  toggleRail: () => set((s) => ({ railCollapsed: !s.railCollapsed })),
  setPaused: (v) => set({ paused: v }),
  setSlowMode: (slowMode) => set({ slowMode }),
  setSearch: (search) => set({ search }),
  toggleSource: (key) =>
    set((s) => ({ sources: { ...s.sources, [key]: !s.sources[key] } })),
  soloSource: (key) => set({ sources: { ...allSources(false), [key]: true } }),
  setAllSources: (on) => set({ sources: allSources(on) }),
  setTickerFilter: (tickerFilter) => set({ tickerFilter }),
  toggleQuestionsOnly: () => set((s) => ({ questionsOnly: !s.questionsOnly })),
  toggleHighSignal: () => set((s) => ({ highSignalOnly: !s.highSignalOnly })),
  toggleModsOnly: () => set((s) => ({ modsOnly: !s.modsOnly })),
  pin: (m) => set({ pinned: m }),
  unpin: () => set({ pinned: null }),
  enqueue: (m) =>
    set((s) =>
      s.queue.some((q) => q.id === m.id)
        ? s
        : { queue: [...s.queue, m].slice(0, MAX_QUEUE) }
    ),
  dequeue: (id) => set((s) => ({ queue: s.queue.filter((q) => q.id !== id) })),
  promote: (id) =>
    set((s) => {
      const item = s.queue.find((q) => q.id === id);
      if (!item) return s;
      return { queue: [item, ...s.queue.filter((q) => q.id !== id)] };
    }),
  clearQueue: () => set({ queue: [] }),
  resetFilters: () =>
    set({
      sources: allSources(true),
      tickerFilter: null,
      questionsOnly: false,
      highSignalOnly: false,
      modsOnly: false,
      search: "",
    }),
}));

/**
 * The terminal's message pipeline. Order: cheap exclusions → heuristics →
 * search → broadcast hygiene. Moderation (hiddenIds / m.hidden) IS respected —
 * a mod-hidden message must never resurface on the broadcast surface (mutes
 * are already enforced upstream at ingest). hq-store's own platform filter,
 * search and spam toggle are deliberately ignored: those belong to the
 * Community page.
 */
export function selectTerminalMessages(
  messages: ChatMessage[],
  hiddenIds: string[],
  f: TerminalFilters
): ChatMessage[] {
  const hidden = new Set(hiddenIds);
  const q = f.search.trim().toLowerCase();
  return messages.filter((m) => {
    if (!f.sources[`${m.platform}:${m.source}` as SourceKey]) return false;
    if (hidden.has(m.id) || m.hidden) return false;
    if (f.modsOnly && m.role !== "mod" && m.role !== "founder" && m.role !== "vip") return false;
    if (f.tickerFilter && !m.tickers.includes(f.tickerFilter)) return false;
    if (f.questionsOnly && !isQuestion(m)) return false;
    if (f.highSignalOnly && !isHighSignal(m)) return false;
    if (q && !(m.content.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q)))
      return false;
    if (f.broadcastMode && (isSpamLike(m.content) || m.flagged)) return false;
    return true;
  });
}
