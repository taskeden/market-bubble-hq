import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner (shadcn convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compact number formatting: 1234 -> "1.2K", 1_500_000 -> "1.5M". */
export function formatCompact(n: number): string {
  if (n < 1000) return `${Math.round(n)}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

/** Full grouped number: 1234567 -> "1,234,567". */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

/** Clock-style timestamp, e.g. "14:32". */
export function formatClock(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Precise timestamp with seconds for terminal feel, e.g. "14:32:07". */
export function formatClockSeconds(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** Human relative time, e.g. "just now", "3m ago", "2h ago". */
export function relativeTime(date: Date | number): string {
  const ts = typeof date === "number" ? date : date.getTime();
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

/** Format a date like "Mar 2024" for join dates. */
export function formatMonthYear(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/** Deterministic 0..1 hash from a string — stable colors/avatars per user. */
export function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0) / 0xffffffff;
}

/** Pick a stable item from a list based on a seed string. */
export function pickStable<T>(items: readonly T[], seed: string): T {
  return items[Math.floor(hashString(seed) * items.length) % items.length];
}

/** Random integer in [min, max]. */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random element of an array. */
export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Weighted random pick. weights need not sum to 1. */
export function weightedPick<T>(items: readonly { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

/** Generate a short unique-ish id. */
export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Clamp a number between bounds. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/** Initials from a display name / username. */
export function initials(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9 ]/g, " ").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
