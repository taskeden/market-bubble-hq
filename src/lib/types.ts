// ─── Market Bubble HQ — domain types ─────────────────────────────────────────

/** Supported chat sources. `hq` = native Market Bubble HQ messages. */
export type Platform = "twitch" | "kick" | "x" | "youtube" | "hq";

/** The hosts whose rooms feed the unified aggregator. */
export type HostId = "ansem" | "banks" | "marketbubble";

export type MessageKind = "chat" | "system" | "bubbles" | "highlight" | "tweet";

export type Sentiment = "bullish" | "bearish" | "neutral";

export type UserRole = "member" | "vip" | "mod" | "founder" | "bot";

/** A single message in the unified feed. */
export interface ChatMessage {
  id: string;
  platform: Platform;
  /** Which host's room/channel this message came from (Kick/Ansem, Twitch/Banks…). */
  source: HostId;
  kind: MessageKind;
  userId: string;
  username: string;
  /** Display name may differ from handle. */
  displayName: string;
  content: string;
  timestamp: number;
  role: UserRole;
  /** Detected $TICKERS referenced in the message. */
  tickers: string[];
  sentiment: Sentiment;
  /** Whether the message @mentions Bubbles. */
  mentionsBubbles: boolean;
  /** Moderation state. */
  hidden?: boolean;
  flagged?: boolean;
  /** Reaction tally for highlighted / native messages. */
  reactions?: number;
  /** Whether this came from the local user (for optimistic UI). */
  self?: boolean;
}

/** A member of the community, aggregated across platforms. */
export interface CommunityUser {
  id: string;
  username: string;
  displayName: string;
  /** Platforms this identity is active on. */
  platforms: Platform[];
  /** Home platform — drives accent color in lists. */
  primaryPlatform: Platform;
  role: UserRole;
  totalMessages: number;
  /** 0–100 composite engagement score. */
  engagementScore: number;
  level: number;
  /** Community rank (1 = top). */
  rank: number;
  joinDate: number;
  lastActive: number;
  online: boolean;
  favoriteTopics: string[];
  badges: BadgeId[];
  /** XP within the current level for the progress bar. */
  xp: number;
  xpToNext: number;
  /** Streak of consecutive active days. */
  streak: number;
  bio?: string;
  /** Email captured at signup. */
  email?: string;
}

export type BadgeId =
  | "founder"
  | "diamond-hands"
  | "early-bird"
  | "top-caller"
  | "streak-30"
  | "mvp"
  | "first-1000"
  | "sentiment-sage"
  | "night-owl"
  | "whale"
  | "helper"
  | "verified";

export interface BadgeDef {
  id: BadgeId;
  label: string;
  description: string;
  /** Tailwind gradient classes for the badge chip. */
  gradient: string;
  icon: string; // lucide icon name
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface PlatformStat {
  platform: Platform;
  messages: number;
  share: number; // 0–1
  viewers: number;
  mpm: number; // messages per minute
}

/** Live aggregate metrics for the right rail + analytics. */
export interface LiveStats {
  totalMessages: number;
  messagesPerMinute: number;
  activeMembers: number;
  currentViewers: number;
  peakViewers: number;
  platformBreakdown: PlatformStat[];
  sentiment: { bullish: number; bearish: number; neutral: number };
  uptimeSeconds: number;
}

export interface TrendingTopic {
  id: string;
  label: string;
  mentions: number;
  /** % change vs previous window. */
  velocity: number;
  sentiment: Sentiment;
}

export interface TrendingStock {
  ticker: string;
  name: string;
  mentions: number;
  /** Simulated session price move, %. */
  change: number;
  sentiment: Sentiment;
  sparkline: number[];
}

export interface Poll {
  id: string;
  question: string;
  options: { id: string; label: string; votes: number }[];
  createdBy: "bubbles" | string;
  createdAt: number;
  totalVotes: number;
  closesAt: number;
  closed: boolean;
}

export type BubblesActionType =
  | "welcome"
  | "summary"
  | "poll"
  | "sentiment"
  | "highlight"
  | "recap"
  | "answer"
  | "trending";

/** A surfaced insight / action authored by the Bubbles AI co-host. */
export interface BubblesInsight {
  id: string;
  type: BubblesActionType;
  title: string;
  body: string;
  timestamp: number;
  /** Optional structured payload (e.g. a poll). */
  poll?: Poll;
  /** Optional referenced message ids (e.g. highlights). */
  refs?: string[];
  accent?: Sentiment;
}

export interface TimeseriesPoint {
  t: number;
  label: string;
  messages: number;
  viewers: number;
  twitch: number;
  kick: number;
  x: number;
  youtube: number;
  hq: number;
}

export interface ModerationEntry {
  id: string;
  action: "mute" | "hide" | "flag" | "warn" | "unmute";
  targetUser: string;
  platform: Platform;
  moderator: string;
  reason: string;
  timestamp: number;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string; // lucide icon name
  badge?: string;
}

export interface DataMode {
  mode: "simulation" | "live";
}
