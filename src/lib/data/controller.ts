import { useHQ } from "@/store/hq-store";
import { effectiveDataMode } from "@/lib/demo";
import { backfill, type ChatSource } from "./engine";
import { createChatSources } from "./adapters";

// ─── Engine controller ───────────────────────────────────────────────────────
// A reference-counted singleton that wires the active chat sources + cadence
// timers into the store. Survives route changes (the dashboard layout holds a
// single reference) and tolerates React StrictMode's double-mount in dev.

let refs = 0;
let active = false;
let seeded = false;
let sources: ChatSource[] = [];
let timers: Array<ReturnType<typeof setInterval>> = [];

function isRunning() {
  return useHQ.getState().running;
}

/** Pull every source's recent backlog, merge by time, seed the feed with it —
    so the chat opens with real history from everywhere, not empty. */
async function seedHistory() {
  const batches = await Promise.all(
    sources.map((s) => (s.history ? s.history().catch(() => []) : Promise.resolve([])))
  );
  if (!active) return; // navigated away mid-fetch
  const merged = batches.flat();
  if (!merged.length) return;
  // Read fresh state AFTER the await — preserve any live messages that already
  // landed during the fetch window — then merge, dedupe by id (a backlog
  // message and its live echo share a stable id), and order by time.
  const store = useHQ.getState();
  const byId = new Map<string, (typeof merged)[number]>();
  for (const m of [...merged, ...store.messages]) byId.set(m.id, m);
  const combined = [...byId.values()].sort((a, b) => a.timestamp - b.timestamp);
  store.seed(combined);
}

function activate() {
  if (active) return;
  active = true;
  const store = useHQ.getState();

  const mode = effectiveDataMode();
  if (!seeded) {
    // Live mode starts EMPTY on purpose — the feed is purely the rooms' real
    // chat (recent backlog + live), nothing fabricated. Demo mode pre-fills a
    // big backlog so the feed looks busy the instant it loads.
    if (mode === "simulation") store.seed(backfill(60));
    store.recomputeIntelligence();
    store.tickStats();
    seeded = true;
  }

  sources = createChatSources();
  for (const src of sources) {
    src.start((m) => {
      if (isRunning()) useHQ.getState().ingest(m);
    });
  }
  // Backfill real history alongside the live connections (live mode only).
  if (mode === "live") void seedHistory();

  timers.push(setInterval(() => isRunning() && useHQ.getState().tickStats(), 2000));
  timers.push(setInterval(() => isRunning() && useHQ.getState().recomputeIntelligence(), 3500));
  timers.push(setInterval(() => isRunning() && useHQ.getState().autoBubble(), 21_000));
  // Kick off Bubbles shortly after load so the panel isn't empty.
  timers.push(setTimeout(() => useHQ.getState().autoBubble(), 4500) as unknown as ReturnType<typeof setInterval>);
}

function deactivate() {
  active = false;
  for (const src of sources) src.stop();
  sources = [];
  for (const t of timers) clearInterval(t);
  timers = [];
}

export function acquireEngine() {
  refs++;
  if (refs === 1) activate();
}

export function releaseEngine() {
  refs = Math.max(0, refs - 1);
  if (refs === 0) deactivate();
}
