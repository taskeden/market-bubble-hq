# 🫧 Market Bubble HQ

**The official digital headquarters of the Market Bubble community.**

Not a stream-discovery site. Not a social network. Not a generic chat box. Market
Bubble HQ is a premium, single-destination home base where the entire community
gathers to watch the stream, talk in one shared conversation, and engage with the
Market Bubble ecosystem — so nobody has to juggle five tabs across Twitch, Kick, X
and Discord ever again.

> Every message from **Twitch · Kick · X · HQ** flows into one real-time feed.
> A polished AI co-host, **Bubbles**, reads the room, runs polls, and keeps the
> community alive. Live intelligence, recognition, analytics and moderation round
> out the experience.

---

## ✨ What's inside

| Area | Highlights |
| --- | --- |
| **Unified Community Feed** | Twitch, Kick, X and native HQ messages merged into one live, animated conversation. Every message shows platform icon **+** name, username, role, timestamp, `$TICKERS` and content. Smart auto-scroll with a "new messages" pill. |
| **Native HQ Chat** | Create an HQ identity and post directly into the unified feed — your messages appear alongside Twitch/Kick/X tagged **HQ** (gold). The website itself becomes part of the conversation. |
| **Unified Viewer Profiles** | Click any username for a slide-over profile: platforms active on, total messages, engagement score, community rank, recent activity, join date, favorite topics and badges. |
| **Bubbles — AI Co-Host** | A persistent, persona-driven community member who welcomes newcomers, summarizes the conversation, reads sentiment, surfaces highlights, generates live polls, gives stream recaps and answers `@Bubbles` questions. |
| **Community Intelligence** | Live trending stocks (with sparklines), most-discussed topics, fastest-growing conversations, community sentiment and most-active members — all computed continuously from the live feed. |
| **Community Recognition** | Leaderboards, community levels (Newcomer → Market Legend), activity badges with rarities, a podium, and a Weekly MVP spotlight. |
| **Analytics** | Beautiful Recharts dashboards: community growth, platform distribution, live message velocity, messages-by-platform, engagement-by-hour and viewer retention. |
| **Moderation** | A modern moderator console: live feed with inline flag/hide/mute, flagged-for-review queue, muted-user management, history search, an auto-spam filter and a full moderation log. |
| **Live Stream** | An embedded player (HQ broadcast surface + switchable Twitch/Kick embeds) in a focused theater layout with the live chat as a second screen. |

---

## 🧱 Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript** (strict)
- **Tailwind CSS** with a custom dark-only design system (glassmorphism, gradients, premium motion)
- **shadcn/ui-style** component library on **Radix UI** primitives
- **Framer Motion** for message/insight animations
- **Recharts** for analytics visualizations
- **Zustand** for the realtime application store
- **TanStack Query** wired for data fetching/caching
- **lucide-react** for iconography

---

## 🏗️ Architecture

The app is built around a clean, swappable real-time pipeline so it's a real product,
not a hard-coded demo.

```
 platform adapters            store (Zustand)              UI
 ┌──────────────┐   message   ┌──────────────────┐       ┌──────────────────┐
 │ TwitchSource │──────────▶  │ ingest()         │  ───▶ │ Unified Feed      │
 │ KickSource   │             │ • dedupe/profiles│       │ Bubbles panel     │
 │ XSource      │             │ • live stats     │       │ Right rail widgets│
 │ Simulation   │             │ • intelligence   │       │ Analytics charts  │
 └──────────────┘             │ • moderation     │       │ Profiles / leaders│
        ▲                     └──────────────────┘       └──────────────────┘
        │  one ChatSource interface — the app is agnostic to the source
```

- **`src/lib/data/adapters.ts`** — every chat source implements the same
  `ChatSource` contract. The default build runs `SimulationSource` (a believable,
  always-live engine) so demos are flawless. Real adapters are included and ready:
  - **Twitch** — anonymous read over the public IRC-WebSocket gateway (no creds).
  - **Kick** — public chatroom over its Pusher-compatible WebSocket.
  - **X** — documented server-route (SSE) stub for the authenticated v2 stream.
- **`src/lib/data/engine.ts`** — the simulation engine: a deterministic roster +
  trading-chat lexicon, a drifting market "mood", and bursty, organic cadence.
- **`src/store/hq-store.ts`** — the single source of truth: messages, live stats,
  timeseries, intelligence, Bubbles insights, polls, moderation, filters.
- **`src/lib/data/intelligence.ts`** — pure aggregations (trending stocks/topics,
  sentiment, most-active) plus a small session market for sparklines.
- **`src/lib/data/bubbles.ts`** — the Bubbles co-host: a heuristic engine that's
  fully functional with zero config, and ready to route prompts to Claude.

### Project structure

```
src/
├── app/
│   ├── (app)/                 # dashboard route group
│   │   ├── page.tsx           # Home
│   │   ├── live/  feed/  analytics/  leaders/  moderation/  settings/
│   │   └── layout.tsx         # mounts the realtime engine + app shell
│   ├── globals.css            # design tokens + premium utilities
│   └── layout.tsx
├── components/
│   ├── ui/                    # shadcn-style primitives (Radix)
│   ├── brand/                 # logo, platform icons, avatars, Bubbles orb
│   ├── layout/                # sidebar, topbar, right rail, app shell
│   ├── feed/                  # unified feed, message row, composer, filters
│   ├── bubbles/               # Bubbles panel + live polls
│   ├── community/             # profile panel, leaderboard, badges
│   ├── widgets/               # intelligence + stat widgets, charts
│   └── stream/                # embedded stream player
├── lib/
│   ├── data/                  # engine, adapters, roster, intelligence, bubbles
│   ├── config.ts  types.ts  utils.ts
├── store/                     # Zustand store
└── hooks/                     # useHQEngine
```

---

## 🚀 Getting started

```bash
npm install
npm run dev          # → http://localhost:3000
```

That's it — **no API keys or config required.** The app starts in **Test mode**, so
the unified feed, the broadcast view, Bubbles, analytics and leaderboards are fully
alive immediately.

Production build: `npm run build && npm start`.
Other scripts: `npm run lint`, `npm run typecheck`.

---

## 🔀 Test mode ↔ Live mode (the only switch you need)

The whole app runs off one swappable data pipeline, controlled by a single setting.

### 🧪 Test mode — the default (zero setup)

A built-in, always-on **simulation crowd** chats across Twitch · Kick · X · YouTube ·
HQ — with host tweets, trending tickers and live stats. It never goes quiet, so it's
ideal for demos, screen recordings and exploring the product. **This is on by
default; you don't have to do anything.**

### 📡 Live mode — connect the real rooms (one line)

Switch to the hosts' real Twitch / Kick / YouTube / X chat:

1. Copy the template: `cp .env.example .env.local`
2. In `.env.local`, set:
   ```bash
   NEXT_PUBLIC_DATA_MODE=live
   ```
3. Restart the dev server.

That's the only change required. The real channels are already pinned (Twitch
`fazebanks`, Kick `ansem`, YouTube `@MarketBubble`) and read **anonymously — no
credentials**. In Live mode the feed is **real-only**: it moves when someone actually
chats, so it's quiet when the hosts are offline. To go back, set
`NEXT_PUBLIC_DATA_MODE=simulation` (or just delete the line) and restart.

> Quick one-off demo without touching files: append **`?demo=1`** to any URL to force
> the simulation crowd for that session (handy if you're on Live mode but want a
> lively walkthrough).

### Optional API keys — Live mode extras

These unlock two extra live features; **everything else works without them.** Add
them to `.env.local`, which is **git-ignored and never committed**:

| Key | Powers | Without it |
| --- | --- | --- |
| `X_BEARER_TOKEN` | Real X/Twitter posts from the hosts | X source reports "not configured" |
| `OPENAI_API_KEY` | Bubbles' AI chat replies (`gpt-4o-mini`) | Bubbles falls back to its built-in heuristic engine |
| `ELEVENLABS_API_KEY` + `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | Bubbles' hands-free voice mode | Voice panel shows a "connect a voice agent" prompt |

See [`.env.example`](.env.example) for the full annotated list. Never paste keys
anywhere other than `.env.local`.

---

## 🏠 The homepage — a native live home, not a dashboard

The home page leads with the experience, in priority order:

1. **Cinematic live hero** — the stream is the main event and is *already showing*
   on load (HBO-Max-style pedestal), with a live timecode, source switcher
   (HQ Broadcast / Twitch / Kick) and a "Watch Live / Expand" overlay. Click to
   enter the full theater.
2. **Attached unified chat** — a Twitch-style chat column fused to the right of the
   stream, merging **Twitch · Kick · X · HQ** with source labels and colors.
3. **Market + news + odds crawls** — a rotating headline **chyron**, an **HQ
   Newsdesk** RTL news ticker, live **prediction-market** odds chips, and the
   **MARKET WATCH** price tape pinned to the base.
4. **Bubbles** — the illustrated AI co-host sits bottom-left with a live speech
   bubble (typing dots → rotating market intel) and an **Ask Bubbles** button.
5. **Login-gated HQ** — anyone can watch and read; chatting, reacting, asking
   Bubbles and earning points open a premium **"Join Market Bubble HQ"** modal,
   followed by a **welcome moment** ("You're now chatting alongside Twitch / Kick /
   X / HQ"). Members earn points and climb the leaderboard.
6. **Compact rail** — a slim, icon-first sidebar (Home · Live · Community · Leaders
   · Pulse) that supports the stream instead of competing with it.

## 🎨 Design — "the luxury business card, alive"

The entire surface is the **silver cardstock from the Market Bubble logo** (sampled
straight from the mark at HSL ~264 4% 72%), so their real **transparent logo** sits
in its native paper. It's a physical premium card that has come to life.

- **Typography is the voice.** A high-contrast Didone serif (**Playfair Display**)
  carries the wordmark, headlines and chyrons; **Inter** handles dense UI;
  **JetBrains Mono** sets every number; and a red handwritten script (**Caveat**)
  echoes the "every Thursday" note on their header.
- **Palette:** silver **cardstock** paper, black **ink** type, a single editorial
  **red** brand accent (buttons, live, the handwriting), the platinum **silver** of
  a glossy lower-third, and **gold** reserved for the premium **HQ** chat source.
- **Source colors:** **X = black · Kick = green · Twitch = purple · HQ = gold**.
  HQ messages get a gold tint so the native room feels special.
- **Live by default:** chat slides in, viewer counts tick, odds and sentiment drift,
  and every ticker crawls right-to-left.

> Assets: the real transparent logo (`public/brand/market-bubble-logo.png`) and the
> Bubbles co-host cutout (`public/brand/bubbles.png`) are placed natively on the
> texture. Swap either file to update the brand.

---

Built for the Market Bubble community. 🫧
