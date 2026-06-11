"use client";

import { useEffect } from "react";
import { acquireEngine, releaseEngine } from "@/lib/data/controller";

/**
 * Mounts the realtime engine for the lifetime of the component. Call once high
 * in the tree (the dashboard layout) so the simulation runs across all pages.
 */
export function useHQEngine() {
  useEffect(() => {
    acquireEngine();
    return () => releaseEngine();
  }, []);
}
