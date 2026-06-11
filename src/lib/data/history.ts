// ─── Historical analytics datasets ───────────────────────────────────────────
// Deterministic, believable history for the Analytics growth/retention charts.
// Generated once at module load with a fixed seed so the visuals are stable.

function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = seeded(0x4d41524b);

export interface GrowthPoint {
  label: string;
  members: number;
  messages: number;
  twitch: number;
  kick: number;
  x: number;
  youtube: number;
  hq: number;
}

/** 30 days of community growth with an accelerating curve. */
export const GROWTH_30D: GrowthPoint[] = (() => {
  const out: GrowthPoint[] = [];
  let members = 5400;
  let dailyMsgs = 18_000;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.UTC(2026, 5, 5) - i * 86_400_000);
    members += Math.round(members * (0.012 + r() * 0.02));
    dailyMsgs = Math.round(dailyMsgs * (1 + (r() - 0.4) * 0.08));
    out.push({
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      members,
      messages: dailyMsgs,
      twitch: Math.round(dailyMsgs * 0.42),
      kick: Math.round(dailyMsgs * 0.2),
      x: Math.round(dailyMsgs * 0.14),
      youtube: Math.round(dailyMsgs * 0.16),
      hq: Math.round(dailyMsgs * 0.08),
    });
  }
  return out;
})();

/** Average engagement by hour-of-day (0–23) — the daily rhythm of the HQ. */
export const ENGAGEMENT_BY_HOUR = Array.from({ length: 24 }, (_, h) => {
  // Peaks around the US market open (13–14 UTC) and the evening recap.
  const openPeak = Math.exp(-((h - 14) ** 2) / 8);
  const evePeak = Math.exp(-((h - 21) ** 2) / 10) * 0.7;
  const base = 0.15 + r() * 0.1;
  return {
    hour: `${h.toString().padStart(2, "0")}:00`,
    activity: Math.round((base + openPeak + evePeak) * 1000),
  };
});

/** Weekly viewer retention cohort (% returning each week). */
export const RETENTION = [
  { week: "Week 1", retention: 100 },
  { week: "Week 2", retention: 74 },
  { week: "Week 3", retention: 61 },
  { week: "Week 4", retention: 55 },
  { week: "Week 5", retention: 52 },
  { week: "Week 6", retention: 49 },
  { week: "Week 7", retention: 48 },
  { week: "Week 8", retention: 47 },
];
