import { create } from "zustand";
import type {
  BubblesActionType,
  BubblesInsight,
  ChatMessage,
  CommunityUser,
  LiveStats,
  ModerationEntry,
  Platform,
  Poll,
  TimeseriesPoint,
  TrendingStock,
  TrendingTopic,
} from "@/lib/types";
import { PLATFORM_ORDER } from "@/lib/config";
import { getRoster, getUser } from "@/lib/data/roster";
import {
  computeMostActive,
  computeSentiment,
  computeTrendingStocks,
  computeTrendingTopics,
  tickMarket,
} from "@/lib/data/intelligence";
import { extractTickers } from "@/lib/data/lexicon";
import { uid, formatClock } from "@/lib/utils";
import * as Bubbles from "@/lib/data/bubbles";

const MAX_MESSAGES = 220;
const VIEWER_RATIO: Record<Platform, number> = {
  twitch: 0.42,
  kick: 0.2,
  x: 0.14,
  youtube: 0.16,
  hq: 0.08,
};

// Believable established baselines so the HQ feels lived-in on first load.
const SEED_BY_PLATFORM: Record<Platform, number> = {
  twitch: 71_200,
  kick: 28_900,
  x: 19_400,
  youtube: 24_300,
  hq: 8_900,
};
const SEED_TOTAL = Object.values(SEED_BY_PLATFORM).reduce((s, n) => s + n, 0);

function emptyStats(): LiveStats {
  return {
    totalMessages: SEED_TOTAL,
    messagesPerMinute: 0,
    activeMembers: 0,
    currentViewers: 2380,
    peakViewers: 2380,
    platformBreakdown: PLATFORM_ORDER.map((p) => ({
      platform: p,
      messages: SEED_BY_PLATFORM[p],
      share: 0,
      viewers: 0,
      mpm: 0,
    })),
    sentiment: { bullish: 50, bearish: 25, neutral: 25 },
    uptimeSeconds: 0,
  };
}

export interface HQState {
  // ── data ───────────────────────────────────────────────────────────────
  messages: ChatMessage[];
  liveProfiles: Record<string, CommunityUser>;
  stats: LiveStats;
  timeseries: TimeseriesPoint[];
  trendingStocks: TrendingStock[];
  trendingTopics: TrendingTopic[];
  mostActive: { user: CommunityUser; count: number }[];
  insights: BubblesInsight[];
  activePoll: Poll | null;
  moderationLog: ModerationEntry[];

  // ── moderation / filters ────────────────────────────────────────────────
  mutedUsers: string[];
  hiddenIds: string[];
  filterPlatforms: Record<Platform, boolean>;
  search: string;
  spamFilter: boolean;

  // ── ui ──────────────────────────────────────────────────────────────────
  selectedUserId: string | null;
  currentUser: CommunityUser;
  running: boolean;

  // ── auth / membership ─────────────────────────────────────────────────────
  isLoggedIn: boolean;
  loginOpen: boolean;
  welcomeOpen: boolean;
  points: number;
  sidebarOpen: boolean;

  // ── Bubbles voice (ElevenLabs) ─────────────────────────────────────────────
  bubblesVoiceId: string | null;
  // True while Bubbles is speaking a one-shot line — the stream ducks its audio.
  bubblesSpeaking: boolean;

  // ── internals ─────────────────────────────────────────────────────────────
  _recent: number[]; // timestamps within last 60s
  _seen: Set<string>;
  _byPlatform: Record<Platform, number>;
  _prevTopicCounts: Map<string, number>;
  _bubbleStep: number;

  // ── actions ───────────────────────────────────────────────────────────────
  ingest: (m: ChatMessage) => void;
  seed: (msgs: ChatMessage[]) => void;
  sendNative: (content: string) => void;
  recomputeIntelligence: () => void;
  tickStats: () => void;
  autoBubble: () => void;
  requestBubbles: (type: BubblesActionType) => void;
  pushAnswer: (question: string) => void;
  votePoll: (optionId: string) => void;
  resolveUser: (id: string) => CommunityUser | undefined;

  selectUser: (id: string | null) => void;
  togglePlatform: (p: Platform) => void;
  setSearch: (q: string) => void;
  setRunning: (r: boolean) => void;
  setDisplayName: (name: string) => void;

  openLogin: () => void;
  closeLogin: () => void;
  login: (name?: string, email?: string) => void;
  logout: () => void;
  dismissWelcome: () => void;
  addPoints: (n: number) => void;
  toggleSidebar: () => void;
  setBubblesVoice: (id: string | null) => void;
  setBubblesSpeaking: (v: boolean) => void;

  muteUser: (username: string, platform: Platform) => void;
  unmuteUser: (username: string) => void;
  hideMessage: (id: string) => void;
  unhideMessage: (id: string) => void;
  flagMessage: (id: string) => void;
  dismissFlag: (id: string) => void;
  toggleSpamFilter: () => void;
  clearChat: () => void;
}

const LOCAL_USER: CommunityUser = {
  id: "u_local",
  username: "You",
  displayName: "You",
  platforms: ["hq"],
  primaryPlatform: "hq",
  role: "member",
  totalMessages: 0,
  engagementScore: 12,
  level: 2,
  rank: 0,
  joinDate: Date.now(),
  lastActive: Date.now(),
  online: true,
  favoriteTopics: ["the open"],
  badges: ["first-1000"],
  xp: 140,
  xpToNext: 1040,
  streak: 1,
  bio: "That's you — welcome to the HQ. 🫧",
};

export const useHQ = create<HQState>((set, get) => ({
  messages: [],
  liveProfiles: {},
  stats: emptyStats(),
  timeseries: [],
  trendingStocks: [],
  trendingTopics: [],
  mostActive: [],
  insights: [],
  activePoll: null,
  moderationLog: [],

  mutedUsers: [],
  hiddenIds: [],
  filterPlatforms: { twitch: true, kick: true, x: true, youtube: true, hq: true },
  search: "",
  spamFilter: false,

  selectedUserId: null,
  currentUser: LOCAL_USER,
  running: true,

  isLoggedIn: false,
  loginOpen: false,
  welcomeOpen: false,
  points: 0,
  sidebarOpen: false,
  bubblesVoiceId: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || null,
  bubblesSpeaking: false,

  _recent: [],
  _seen: new Set<string>(),
  _byPlatform: { ...SEED_BY_PLATFORM },
  _prevTopicCounts: new Map(),
  _bubbleStep: 0,

  resolveUser: (id) => getUser(id) ?? get().liveProfiles[id] ?? (id === "u_local" ? get().currentUser : undefined),

  ingest: (m) => {
    const state = get();
    if (state.mutedUsers.includes(m.username.toLowerCase())) return;

    // Track ephemeral profiles for live (non-roster) users so clicking works.
    let liveProfiles = state.liveProfiles;
    if (!getUser(m.userId) && m.userId !== "u_local" && !liveProfiles[m.userId]) {
      liveProfiles = { ...liveProfiles, [m.userId]: synthProfile(m) };
    }

    const now = m.timestamp;
    const _recent = [...state._recent, now].filter((t) => now - t < 60_000);
    const _byPlatform = { ...state._byPlatform, [m.platform]: state._byPlatform[m.platform] + 1 };

    const messages = [...state.messages, m].slice(-MAX_MESSAGES);

    // Welcome flow: occasionally have Bubbles greet a genuinely new speaker.
    let insights = state.insights;
    const seen = state._seen;
    if (!seen.has(m.userId) && m.kind === "chat") {
      seen.add(m.userId);
      if (seen.size > 6 && Math.random() > 0.86) {
        insights = [Bubbles.welcome(m.displayName), ...insights].slice(0, 40);
      }
    }

    set({
      messages,
      liveProfiles,
      insights,
      _recent,
      _byPlatform,
      stats: { ...state.stats, totalMessages: state.stats.totalMessages + 1 },
    });

    // If a member asks Bubbles something, answer shortly after.
    if (m.mentionsBubbles && m.kind === "chat" && !m.self) {
      setTimeout(() => {
        const s = get();
        s.pushAnswer(m.content);
      }, 900 + Math.random() * 800);
    }
  },

  seed: (msgs) => {
    const byPlatform = { ...get()._byPlatform };
    const seen = get()._seen;
    for (const m of msgs) seen.add(m.userId);
    set({ messages: msgs.slice(-MAX_MESSAGES), _seen: seen });
    get().recomputeIntelligence();
  },

  sendNative: (content) => {
    const text = content.trim();
    if (!text) return;
    const u = get().currentUser;
    const msg: ChatMessage = {
      id: uid("hq"),
      platform: "hq",
      source: "marketbubble",
      kind: "chat",
      userId: u.id,
      username: u.username,
      displayName: u.displayName,
      content: text,
      timestamp: Date.now(),
      role: u.role,
      tickers: extractTickers(text),
      sentiment: "neutral",
      mentionsBubbles: /bubbles/i.test(text),
      self: true,
    };
    get().ingest(msg);
    set((s) => ({ currentUser: { ...s.currentUser, totalMessages: s.currentUser.totalMessages + 1 } }));
    if (msg.mentionsBubbles) {
      setTimeout(() => get().pushAnswer(text), 800);
    }
  },

  recomputeIntelligence: () => {
    const state = get();
    const sentiment = computeSentiment(state.messages);
    const bias = (sentiment.bullish - sentiment.bearish) / 100;
    tickMarket(bias);
    const trendingStocks = computeTrendingStocks(state.messages);
    const { topics, counts } = computeTrendingTopics(state.messages, state._prevTopicCounts);
    const mostActive = computeMostActive(state.messages, state.resolveUser);
    set({
      trendingStocks,
      trendingTopics: topics,
      mostActive,
      _prevTopicCounts: counts,
      stats: { ...state.stats, sentiment },
    });
  },

  tickStats: () => {
    const state = get();
    const now = Date.now();
    const _recent = state._recent.filter((t) => now - t < 60_000);
    const mpm = _recent.length;

    // Viewers random-walk, nudged by message velocity + sentiment.
    const bias = (state.stats.sentiment.bullish - state.stats.sentiment.bearish) / 100;
    const drift = (Math.random() - 0.5) * 28 + bias * 10 + (mpm > 30 ? 6 : -2);
    const currentViewers = Math.max(800, Math.round(state.stats.currentViewers + drift));
    const peakViewers = Math.max(state.stats.peakViewers, currentViewers);

    const rosterOnline = getRoster().filter((u) => u.online).length;
    const activeMembers = rosterOnline + Math.round(mpm * 0.6) + Object.keys(state.liveProfiles).length;

    const totalAll = PLATFORM_ORDER.reduce((s, p) => s + state._byPlatform[p], 0);
    const platformBreakdown = PLATFORM_ORDER.map((p) => ({
      platform: p,
      messages: state._byPlatform[p],
      share: state._byPlatform[p] / totalAll,
      viewers: Math.round(currentViewers * VIEWER_RATIO[p]),
      mpm: Math.round(mpm * (state._byPlatform[p] / totalAll)),
    }));

    const point: TimeseriesPoint = {
      t: now,
      label: formatClock(now),
      messages: mpm,
      viewers: currentViewers,
      twitch: Math.round(mpm * VIEWER_RATIO.twitch),
      kick: Math.round(mpm * VIEWER_RATIO.kick),
      x: Math.round(mpm * VIEWER_RATIO.x),
      youtube: Math.round(mpm * VIEWER_RATIO.youtube),
      hq: Math.round(mpm * VIEWER_RATIO.hq),
    };

    set({
      _recent,
      stats: {
        ...state.stats,
        messagesPerMinute: mpm,
        currentViewers,
        peakViewers,
        activeMembers,
        platformBreakdown,
        uptimeSeconds: state.stats.uptimeSeconds + 2,
      },
      timeseries: [...state.timeseries, point].slice(-60),
    });
  },

  autoBubble: () => {
    const state = get();
    const step = state._bubbleStep % 5;
    let insight: BubblesInsight | null = null;
    switch (step) {
      case 0:
        insight = Bubbles.summarize(state.messages);
        break;
      case 1:
        insight = Bubbles.sentimentReadout(state.stats.sentiment);
        break;
      case 2:
        insight = Bubbles.trendingCallout(state.trendingTopics);
        break;
      case 3:
        insight = Bubbles.highlightMessage(state.messages);
        break;
      case 4: {
        const poll = Bubbles.generatePoll(state.trendingStocks);
        set({ activePoll: poll.poll ?? null });
        insight = poll;
        break;
      }
    }
    if (insight) {
      set((s) => ({ insights: [insight!, ...s.insights].slice(0, 40), _bubbleStep: s._bubbleStep + 1 }));
    } else {
      set((s) => ({ _bubbleStep: s._bubbleStep + 1 }));
    }
  },

  requestBubbles: (type) => {
    const state = get();
    let insight: BubblesInsight | null = null;
    switch (type) {
      case "summary":
        insight = Bubbles.summarize(state.messages);
        break;
      case "sentiment":
        insight = Bubbles.sentimentReadout(state.stats.sentiment);
        break;
      case "trending":
        insight = Bubbles.trendingCallout(state.trendingTopics);
        break;
      case "highlight":
        insight = Bubbles.highlightMessage(state.messages) ?? Bubbles.summarize(state.messages);
        break;
      case "recap":
        insight = Bubbles.recap(state.stats);
        break;
      case "poll": {
        const poll = Bubbles.generatePoll(state.trendingStocks);
        set({ activePoll: poll.poll ?? null });
        insight = poll;
        break;
      }
      default:
        insight = Bubbles.summarize(state.messages);
    }
    if (insight) set((s) => ({ insights: [insight!, ...s.insights].slice(0, 40) }));
  },

  pushAnswer: (question: string) => {
    const s = get();
    const insight = Bubbles.answer(question, s.trendingStocks);
    set({ insights: [insight, ...s.insights].slice(0, 40) });
  },

  votePoll: (optionId) => {
    const poll = get().activePoll;
    if (!poll || poll.closed) return;
    const options = poll.options.map((o) =>
      o.id === optionId ? { ...o, votes: o.votes + 1 } : o
    );
    set({
      activePoll: {
        ...poll,
        options,
        totalVotes: options.reduce((sum, o) => sum + o.votes, 0),
      },
    });
  },

  selectUser: (id) => set({ selectedUserId: id }),
  togglePlatform: (p) =>
    set((s) => ({ filterPlatforms: { ...s.filterPlatforms, [p]: !s.filterPlatforms[p] } })),
  setSearch: (q) => set({ search: q }),
  setRunning: (r) => set({ running: r }),
  setDisplayName: (name) =>
    set((s) => ({
      currentUser: { ...s.currentUser, displayName: name || "You", username: name || "You" },
    })),

  openLogin: () => set({ loginOpen: true }),
  closeLogin: () => set({ loginOpen: false }),
  login: (name, email) =>
    set((s) => ({
      isLoggedIn: true,
      loginOpen: false,
      welcomeOpen: true,
      points: s.points || 1240,
      currentUser: {
        ...s.currentUser,
        ...(name ? { displayName: name, username: name } : {}),
        ...(email ? { email } : {}),
      },
    })),
  logout: () => set({ isLoggedIn: false, welcomeOpen: false }),
  dismissWelcome: () => set({ welcomeOpen: false }),
  addPoints: (n) => set((s) => ({ points: s.points + n })),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setBubblesVoice: (id) => {
    if (typeof window !== "undefined") {
      if (id) window.localStorage.setItem("mb-bubbles-voice", id);
      else window.localStorage.removeItem("mb-bubbles-voice");
    }
    set({ bubblesVoiceId: id });
  },
  setBubblesSpeaking: (v) => set({ bubblesSpeaking: v }),

  muteUser: (username, platform) => {
    const key = username.toLowerCase();
    set((s) => ({
      mutedUsers: s.mutedUsers.includes(key) ? s.mutedUsers : [...s.mutedUsers, key],
      moderationLog: [
        modEntry("mute", username, platform, "Muted by moderator"),
        ...s.moderationLog,
      ].slice(0, 60),
    }));
  },
  unmuteUser: (username) => {
    const key = username.toLowerCase();
    set((s) => ({
      mutedUsers: s.mutedUsers.filter((u) => u !== key),
      moderationLog: [modEntry("unmute", username, "hq", "Unmuted"), ...s.moderationLog].slice(0, 60),
    }));
  },
  hideMessage: (id) => {
    const msg = get().messages.find((m) => m.id === id);
    set((s) => ({
      hiddenIds: [...s.hiddenIds, id],
      moderationLog: msg
        ? [modEntry("hide", msg.username, msg.platform, "Message hidden"), ...s.moderationLog].slice(0, 60)
        : s.moderationLog,
    }));
  },
  unhideMessage: (id) => set((s) => ({ hiddenIds: s.hiddenIds.filter((x) => x !== id) })),
  dismissFlag: (id) =>
    set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, flagged: false } : m)) })),
  toggleSpamFilter: () => set((s) => ({ spamFilter: !s.spamFilter })),
  flagMessage: (id) => {
    const msg = get().messages.find((m) => m.id === id);
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, flagged: true } : m)),
      moderationLog: msg
        ? [modEntry("flag", msg.username, msg.platform, "Flagged for review"), ...s.moderationLog].slice(0, 60)
        : s.moderationLog,
    }));
  },
  clearChat: () => set({ messages: [] }),
}));

function modEntry(
  action: ModerationEntry["action"],
  targetUser: string,
  platform: Platform,
  reason: string
): ModerationEntry {
  return {
    id: uid("mod"),
    action,
    targetUser,
    platform,
    moderator: "You",
    reason,
    timestamp: Date.now(),
  };
}

/** Build a believable profile for a live (non-roster) speaker. */
function synthProfile(m: ChatMessage): CommunityUser {
  return {
    id: m.userId,
    username: m.username,
    displayName: m.displayName,
    platforms: [m.platform],
    primaryPlatform: m.platform,
    role: m.role,
    totalMessages: Math.floor(Math.random() * 400) + 5,
    engagementScore: Math.floor(Math.random() * 40) + 20,
    level: Math.floor(Math.random() * 10) + 1,
    rank: 0,
    joinDate: Date.now() - Math.floor(Math.random() * 120) * 86_400_000,
    lastActive: Date.now(),
    online: true,
    favoriteTopics: m.tickers.map((t) => `$${t}`).slice(0, 2),
    badges: [],
    xp: 100,
    xpToNext: 600,
    streak: Math.floor(Math.random() * 5),
  };
}

/** Selector: messages after platform filter, search and hidden state. */
export function selectVisibleMessages(s: HQState): ChatMessage[] {
  const q = s.search.trim().toLowerCase();
  return s.messages.filter((m) => {
    if (!s.filterPlatforms[m.platform]) return false;
    if (s.hiddenIds.includes(m.id) || m.hidden) return false;
    if (q && !(m.content.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q)))
      return false;
    return true;
  });
}
