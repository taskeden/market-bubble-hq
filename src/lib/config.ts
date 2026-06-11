import type { BadgeDef, BadgeId, HostId, NavItem, Platform, UserRole } from "./types";

export const SITE = {
  name: "Market Bubble HQ",
  short: "MB HQ",
  tagline: "The official headquarters of the Market Bubble community",
  /** Generic fallback handle (used only when an env override is absent). */
  channel: "marketbubble",
  // ── Real platform handles (used for stream embeds + outbound links) ──────────
  youtube: {
    handle: "MarketBubble",
    channelId: "UC2Yw4-WyejthY7OLpbVX4Ug",
    url: "https://www.youtube.com/@MarketBubble",
  },
  twitch: "fazebanks",
  kick: "ansem",
  x: "MarketBubble",
};

/** Ordered follow links for the community's official socials. */
export const SOCIALS = [
  { id: "x", label: "X", handle: "@MarketBubble", url: `https://x.com/${SITE.x}` },
  { id: "twitch", label: "Twitch", handle: "fazebanks", url: `https://www.twitch.tv/${SITE.twitch}` },
  { id: "kick", label: "Kick", handle: "ansem", url: `https://kick.com/${SITE.kick}` },
  { id: "youtube", label: "YouTube", handle: "@MarketBubble", url: SITE.youtube.url },
] as const;

// Primary, community-first navigation (compact rail).
export const NAV: NavItem[] = [
  { title: "Home", href: "/", icon: "LayoutDashboard" },
  { title: "Community", href: "/feed", icon: "MessagesSquare" },
  { title: "Leaders", href: "/leaders", icon: "Trophy" },
];

// Secondary, bottom-anchored utilities.
export const NAV_SECONDARY: NavItem[] = [
  { title: "Moderation", href: "/moderation", icon: "ShieldCheck" },
  { title: "Settings", href: "/settings", icon: "Settings" },
];

interface PlatformMeta {
  id: Platform;
  label: string;
  /** Tailwind text color token. */
  text: string;
  /** Tailwind bg token (translucent). */
  bgSoft: string;
  /** Tailwind border token. */
  border: string;
  /** Raw HSL for inline glows / charts. */
  hsl: string;
  hex: string;
  /** Short glyph used in the platform icon chip. */
  glyph: string;
}

export const PLATFORMS: Record<Platform, PlatformMeta> = {
  twitch: {
    id: "twitch",
    label: "Twitch",
    text: "text-twitch",
    bgSoft: "bg-twitch/10",
    border: "border-twitch/30",
    hsl: "265 62% 52%",
    hex: "#7839D0",
    glyph: "twitch",
  },
  kick: {
    id: "kick",
    label: "Kick",
    text: "text-kick",
    bgSoft: "bg-kick/10",
    border: "border-kick/30",
    hsl: "112 52% 34%",
    hex: "#36842A",
    glyph: "kick",
  },
  x: {
    id: "x",
    label: "X",
    text: "text-x",
    bgSoft: "bg-x/10",
    border: "border-x/25",
    hsl: "0 0% 12%",
    hex: "#1F1F1F",
    glyph: "x",
  },
  youtube: {
    id: "youtube",
    label: "YouTube",
    text: "text-youtube",
    bgSoft: "bg-youtube/10",
    border: "border-youtube/30",
    hsl: "0 85% 45%",
    hex: "#D32B22",
    glyph: "youtube",
  },
  hq: {
    id: "hq",
    label: "HQ",
    text: "text-gold",
    bgSoft: "bg-gold/10",
    border: "border-gold/30",
    hsl: "40 90% 42%",
    hex: "#CB8B0B",
    glyph: "hq",
  },
};

export const PLATFORM_ORDER: Platform[] = ["twitch", "kick", "x", "youtube", "hq"];

// ─── Hosts — the people whose rooms feed the unified aggregator ──────────────
// Host accents are deliberately NOT platform colors: host identity must read
// independently of platform hue (gold / platinum / editorial red — luxury).

export interface HostMeta {
  id: HostId;
  label: string;
  /** Compact plate label, e.g. "ANS". */
  short: string;
  /** X / social handle (no @) — used on the host's own tweet cards. */
  handle: string;
  /** Tailwind text token for the host accent. */
  accent: string;
  /** Raw HSL for inline dots/glows/bars. */
  hsl: string;
}

export const HOSTS: Record<HostId, HostMeta> = {
  ansem: { id: "ansem", label: "Ansem", short: "ANS", handle: "blknoiz06", accent: "text-gold", hsl: "44 96% 53%" },
  banks: { id: "banks", label: "Banks", short: "BNK", handle: "fazebanks", accent: "text-foreground", hsl: "252 9% 86%" },
  marketbubble: { id: "marketbubble", label: "Market Bubble", short: "MB", handle: "MarketBubble", accent: "text-hq", hsl: "4 72% 49%" },
};

export const HOST_ORDER: HostId[] = ["ansem", "banks", "marketbubble"];

/** A `platform:host` pair — the atomic unit of the terminal's Source Matrix. */
export type SourceKey = `${Platform}:${HostId}`;

export interface SourcePair {
  key: SourceKey;
  platform: Platform;
  host: HostId;
  /** Display label for the channel/room this pair represents. */
  channel: string;
}

/** Every room the aggregator listens to (the Source Matrix rows). */
export const SOURCE_PAIRS: SourcePair[] = [
  { key: "kick:ansem", platform: "kick", host: "ansem", channel: `kick.com/${SITE.kick}` },
  { key: "x:ansem", platform: "x", host: "ansem", channel: "Ansem on X" },
  { key: "twitch:banks", platform: "twitch", host: "banks", channel: `twitch.tv/${SITE.twitch}` },
  { key: "x:banks", platform: "x", host: "banks", channel: "Banks on X" },
  { key: "youtube:marketbubble", platform: "youtube", host: "marketbubble", channel: `@${SITE.youtube.handle}` },
  { key: "x:marketbubble", platform: "x", host: "marketbubble", channel: `@${SITE.x}` },
  { key: "hq:marketbubble", platform: "hq", host: "marketbubble", channel: "HQ native chat" },
];

export function sourceKey(platform: Platform, host: HostId): SourceKey {
  return `${platform}:${host}`;
}

/** Which host's room a message on this platform belongs to (sim + live default). */
export function hostForPlatform(p: Platform): HostId {
  switch (p) {
    case "kick":
      return "ansem";
    case "twitch":
      return "banks";
    case "youtube":
    case "hq":
      return "marketbubble";
    case "x": {
      // X chatter splits across the hosts' accounts; weight toward the talent.
      const r = Math.random();
      return r < 0.4 ? "ansem" : r < 0.8 ? "banks" : "marketbubble";
    }
  }
}

export const ROLE_META: Record<UserRole, { label: string; class: string }> = {
  founder: { label: "Founder", class: "text-hq" },
  mod: { label: "Mod", class: "text-emerald-600" },
  vip: { label: "VIP", class: "text-violet-600" },
  member: { label: "Member", class: "text-muted-foreground" },
  bot: { label: "AI", class: "text-bubble" },
};

export const BADGES: Record<BadgeId, BadgeDef> = {
  founder: {
    id: "founder",
    label: "Founder",
    description: "Part of Market Bubble since day one.",
    gradient: "from-amber-300 to-yellow-600",
    icon: "Crown",
    rarity: "legendary",
  },
  "diamond-hands": {
    id: "diamond-hands",
    label: "Diamond Hands",
    description: "Held through the volatility. Never folded.",
    gradient: "from-cyan-300 to-sky-500",
    icon: "Gem",
    rarity: "epic",
  },
  "early-bird": {
    id: "early-bird",
    label: "Early Bird",
    description: "First in chat before the bell, every session.",
    gradient: "from-orange-300 to-rose-500",
    icon: "Sunrise",
    rarity: "rare",
  },
  "top-caller": {
    id: "top-caller",
    label: "Top Caller",
    description: "Called the move before it happened.",
    gradient: "from-emerald-300 to-green-600",
    icon: "Target",
    rarity: "epic",
  },
  "streak-30": {
    id: "streak-30",
    label: "30-Day Streak",
    description: "Showed up 30 sessions in a row.",
    gradient: "from-fuchsia-400 to-purple-600",
    icon: "Flame",
    rarity: "rare",
  },
  mvp: {
    id: "mvp",
    label: "Weekly MVP",
    description: "Most valuable community member this week.",
    gradient: "from-yellow-300 to-amber-600",
    icon: "Medal",
    rarity: "legendary",
  },
  "first-1000": {
    id: "first-1000",
    label: "First 1,000",
    description: "One of the first 1,000 members of HQ.",
    gradient: "from-indigo-300 to-blue-600",
    icon: "Rocket",
    rarity: "rare",
  },
  "sentiment-sage": {
    id: "sentiment-sage",
    label: "Sentiment Sage",
    description: "Reads the room better than anyone.",
    gradient: "from-teal-300 to-emerald-600",
    icon: "Brain",
    rarity: "epic",
  },
  "night-owl": {
    id: "night-owl",
    label: "Night Owl",
    description: "Keeps the after-hours conversation alive.",
    gradient: "from-slate-300 to-indigo-500",
    icon: "Moon",
    rarity: "common",
  },
  whale: {
    id: "whale",
    label: "Whale",
    description: "Moves size and moves the conversation.",
    gradient: "from-blue-300 to-cyan-600",
    icon: "Waves",
    rarity: "legendary",
  },
  helper: {
    id: "helper",
    label: "Helper",
    description: "Always answering newcomer questions.",
    gradient: "from-green-300 to-teal-600",
    icon: "HeartHandshake",
    rarity: "common",
  },
  verified: {
    id: "verified",
    label: "Verified",
    description: "Identity verified across platforms.",
    gradient: "from-sky-300 to-blue-600",
    icon: "BadgeCheck",
    rarity: "common",
  },
};

/** Level thresholds — cumulative XP required to reach each level. */
export function levelTitle(level: number): string {
  if (level >= 50) return "Market Legend";
  if (level >= 40) return "Bubble Oracle";
  if (level >= 30) return "Whale";
  if (level >= 22) return "Market Maker";
  if (level >= 15) return "Day Trader";
  if (level >= 9) return "Swing Trader";
  if (level >= 4) return "Paper Hands";
  return "Newcomer";
}

/** Ships in simulation (the built-in lively crowd) so a fresh clone is fully
    alive out of the box with zero setup. Set NEXT_PUBLIC_DATA_MODE=live in
    .env.local to connect the real rooms (the feed then only moves when actual
    messages arrive). */
export const DATA_MODE: "simulation" | "live" =
  (process.env.NEXT_PUBLIC_DATA_MODE as "simulation" | "live") || "simulation";

/** Ansem's Kick chatroom id (kick.com/ansem → chatroom 108796898). Chatroom ids
    are permanent per channel; Kick's channel-lookup API sits behind Cloudflare
    bot protection, so we bake the id and allow an env override. */
export const KICK_CHATROOM_ID = process.env.NEXT_PUBLIC_KICK_CHATROOM_ID || "108796898";
