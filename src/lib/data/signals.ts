import type { ChatMessage } from "../types";

// ─── Message signal heuristics ───────────────────────────────────────────────
// Shared by the Chat Terminal's filters (Questions only / High signal) and its
// Top Questions panel. Computed on demand — the buffer caps at 220 messages, so
// a few regexes per recompute is negligible and the heuristics can evolve
// without leaving stale flags on stored messages.

const INTERROGATIVE =
  /^(what|why|how|when|where|who|which|is|are|can|could|should|would|does|do|did|anyone|any1|thoughts|wen)\b/i;

/** Does this read as an audience question? */
export function isQuestion(m: ChatMessage): boolean {
  const text = m.content.trim();
  return text.includes("?") || INTERROGATIVE.test(text);
}

/** Same heuristics as the Community feed's spam toggle (duplicated on purpose —
    the terminal's broadcast hygiene is independent of that page's setting). */
export function isSpamLike(text: string): boolean {
  return (
    /(.)\1{6,}/.test(text) || // long character runs
    /(https?:\/\/|www\.)/i.test(text) || // links
    /\b(free|airdrop|giveaway|dm me|follow\s?4\s?follow)\b/i.test(text)
  );
}

/** Scored "worth the hosts' attention" heuristic. Threshold ≥ 3. */
export function isHighSignal(m: ChatMessage): boolean {
  let score = 0;
  if (m.tickers.length > 0) score += 2;
  if (m.tickers.length > 1) score += 1;
  if ((m.reactions ?? 0) >= 5) score += 2;
  if (m.role === "vip" || m.role === "mod" || m.role === "founder") score += 1;
  if (m.content.length >= 48) score += 1;
  if (m.kind === "highlight") score += 1;
  if (m.tickers.length > 0 && isQuestion(m)) score += 1;
  if (isSpamLike(m.content)) score -= 3;
  return score >= 3;
}
