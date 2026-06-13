"use client";

import { useEffect, useState } from "react";
import { DATA_MODE } from "./config";

// ─── Demo / test mode ────────────────────────────────────────────────────────
// The chat is real-only by default (the hosts' actual rooms). Demo mode flips
// the whole feed back to the lively built-in simulation crowd — bots across
// every platform + host tweets + trending — so the product can be shown off
// (e.g. a Loom walkthrough) without waiting for the streamers to be live.
//
// Turn it on with the toggle in Settings, or by opening any page with ?demo=1.
// It persists in localStorage and re-wires the engine on the next load.

const KEY = "mb-demo";

/** Is demo mode active right now? (URL param wins, else the saved preference.) */
export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  const p = new URLSearchParams(window.location.search).get("demo");
  if (p === "1" || p === "true") return true;
  if (p === "0" || p === "false") return false;
  // An explicit env NEXT_PUBLIC_DATA_MODE=live is authoritative: a stale saved
  // demo preference must not silently keep the sim crowd on over the real rooms.
  // (?demo=1 above still forces a one-off demo session when you want one.)
  if (DATA_MODE === "live") return false;
  return window.localStorage.getItem(KEY) === "1";
}

/** Persist a `?demo=1` / `?demo=0` URL param into the saved preference, so demo
    mode survives client-side navigation (which drops the query string). Call
    once on mount. */
export function syncDemoFromUrl() {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search).get("demo");
  if (p === "1" || p === "true") window.localStorage.setItem(KEY, "1");
  else if (p === "0" || p === "false") window.localStorage.removeItem(KEY);
}

/** Persist the choice and reload so the controller re-wires its sources cleanly. */
export function setDemoMode(on: boolean) {
  if (typeof window === "undefined") return;
  if (on) window.localStorage.setItem(KEY, "1");
  else window.localStorage.removeItem(KEY);
  const url = new URL(window.location.href);
  if (on) url.searchParams.set("demo", "1");
  else url.searchParams.delete("demo");
  window.location.href = url.toString();
}

/** The mode the engine should actually run: demo → simulation, else the env default. */
export function effectiveDataMode(): "simulation" | "live" {
  return isDemoMode() ? "simulation" : DATA_MODE;
}

/** SSR-safe hook: false on the server + first client render (matches hydration),
    then the real value after mount. */
export function useDemoMode(): boolean {
  const [demo, setDemo] = useState(false);
  useEffect(() => setDemo(isDemoMode()), []);
  return demo;
}
