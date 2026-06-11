import type { BadgeId, CommunityUser, Platform, UserRole } from "../types";
import { levelTitle } from "../config";
import {
  makeHQName,
  makeKickName,
  makeTwitchName,
  makeXName,
  makeYouTubeName,
  TOPICS,
} from "./lexicon";

// Seeded PRNG (mulberry32) so the entire roster — names, scores, join dates,
// badges — is identical on every load. Profiles must be stable because the same
// user appears in the feed, leaderboards, right rail and profile panel.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0xb0bb1e);
const pickR = <T,>(a: readonly T[]) => a[Math.floor(rand() * a.length)];
const intR = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

const PLATFORM_POOL: Platform[] = ["twitch", "kick", "x", "youtube", "hq"];

const BADGE_POOL: BadgeId[] = [
  "diamond-hands", "early-bird", "top-caller", "streak-30",
  "first-1000", "sentiment-sage", "night-owl", "whale", "helper", "verified",
];

const NOW = Date.UTC(2026, 5, 5, 18, 0, 0); // fixed "now" for deterministic dates

function buildUser(i: number): CommunityUser {
  // Primary platform distribution roughly mirrors a creator's real audience.
  const primary = pickR<Platform>([
    "twitch", "twitch", "twitch",
    "kick", "kick",
    "x", "x",
    "youtube", "youtube",
    "hq", "hq", "hq",
  ]);

  let username: string;
  let displayName: string;
  switch (primary) {
    case "twitch":
      username = makeTwitchName(i * 3 + 1);
      displayName = username;
      break;
    case "kick":
      username = makeKickName(i * 5 + 2);
      displayName = username;
      break;
    case "x": {
      const x = makeXName(i * 7 + 3);
      username = x.handle;
      displayName = x.display;
      break;
    }
    case "youtube":
      username = makeYouTubeName(i * 13 + 5);
      displayName = username;
      break;
    default:
      username = makeHQName(i * 11 + 4);
      displayName = username;
  }

  // Some members are multi-platform (cross-posters / power users).
  const platforms = new Set<Platform>([primary]);
  const extra = intR(0, 2);
  for (let k = 0; k < extra; k++) platforms.add(pickR(PLATFORM_POOL));

  const totalMessages = Math.round((rand() ** 1.7) * 9000) + 12;
  const engagementScore = Math.min(
    100,
    Math.round((totalMessages / 9000) * 70 + rand() * 30)
  );
  const level = Math.max(1, Math.round((engagementScore / 100) * 48 + rand() * 4));
  const xpToNext = 800 + level * 120;
  const xp = Math.floor(rand() * xpToNext);

  const role: UserRole = (() => {
    if (engagementScore > 88 && rand() > 0.6) return "vip";
    if (rand() > 0.94) return "mod";
    return "member";
  })();

  const badgeCount = engagementScore > 80 ? intR(2, 4) : intR(0, 2);
  const badges = new Set<BadgeId>();
  for (let b = 0; b < badgeCount; b++) badges.add(pickR(BADGE_POOL));
  if (role === "vip") badges.add("verified");

  const favoriteTopics = new Set<string>();
  for (let t = 0; t < intR(2, 3); t++) favoriteTopics.add(pickR(TOPICS));

  const joinDaysAgo = intR(3, 540);

  return {
    id: `u_${i}`,
    username,
    displayName,
    platforms: [...platforms],
    primaryPlatform: primary,
    role,
    totalMessages,
    engagementScore,
    level,
    rank: 0, // assigned after sort
    joinDate: NOW - joinDaysAgo * 86_400_000,
    lastActive: NOW - intR(0, 90) * 60_000,
    online: rand() > 0.45,
    favoriteTopics: [...favoriteTopics],
    badges: [...badges],
    xp,
    xpToNext,
    streak: intR(0, 64),
    bio: undefined,
  };
}

// ── The founder / creator anchor of the community ────────────────────────────
const FOUNDER: CommunityUser = {
  id: "u_noah",
  username: "Noah",
  displayName: "Noah",
  platforms: ["hq", "twitch", "kick", "x"],
  primaryPlatform: "hq",
  role: "founder",
  totalMessages: 18420,
  engagementScore: 100,
  level: 50,
  rank: 0,
  joinDate: NOW - 540 * 86_400_000,
  lastActive: NOW - 30_000,
  online: true,
  favoriteTopics: ["the Fed", "AI capex", "0DTE options"],
  badges: ["founder", "mvp", "whale", "diamond-hands", "verified"],
  xp: 5200,
  xpToNext: 6000,
  streak: 540,
  bio: "Founder of Market Bubble. Live most weekdays before the bell. 🫧",
};

const ROSTER: CommunityUser[] = (() => {
  const generated = Array.from({ length: 84 }, (_, i) => buildUser(i));
  const all = [FOUNDER, ...generated];
  // Rank by engagement, then message volume.
  all.sort(
    (a, b) =>
      b.engagementScore - a.engagementScore || b.totalMessages - a.totalMessages
  );
  all.forEach((u, idx) => {
    u.rank = idx + 1;
    if (idx === 1) u.badges = [...new Set([...u.badges, "mvp" as BadgeId])];
  });
  return all;
})();

export const ROSTER_MAP: Map<string, CommunityUser> = new Map(
  ROSTER.map((u) => [u.id, u])
);

export function getRoster(): CommunityUser[] {
  return ROSTER;
}

export function getUser(id: string): CommunityUser | undefined {
  return ROSTER_MAP.get(id);
}

export function getUserByName(name: string): CommunityUser | undefined {
  const lower = name.toLowerCase();
  return ROSTER.find(
    (u) => u.username.toLowerCase() === lower || u.displayName.toLowerCase() === lower
  );
}

export { levelTitle };
