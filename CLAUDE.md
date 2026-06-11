# CLAUDE.md — Market Bubble HQ (working context / handoff)

> Auto-loaded at the start of every Claude Code session in this repo. Captures
> current state + decisions so a fresh chat continues seamlessly.
> Project root: `C:\Users\noahf\OneDrive\Documents\Desktop\StreamBubble`

## What this is
**Market Bubble HQ** — a premium, native "live home" for the Market Bubble
community (finance/crypto/attention-economy YouTuber). Aggregates **Twitch + Kick +
X + YouTube + native HQ** chat into one feed, fronted by a full-bleed cinematic live
stream, broadcast tickers, an AI co-host (**Bubbles**), points/leaderboards,
luxury-cardstock brand, and a full-screen **Chat Terminal** (broadcast-grade chat
command center — see its section). NOT a generic SaaS dashboard. Heavily styled
after **Twitch's** chat + layout.

## Stack & run
- Next.js **14.2.35** (App Router) · React 18 · TS (strict) · Tailwind 3.4 · Radix +
  shadcn-style · Framer Motion · Recharts · Zustand · TanStack Query.
- Run: `npm run dev` → http://localhost:3000. Verify: `npx tsc --noEmit` + `npm run
  build` (all routes prerender clean; `ƒ /api/x-stream` + `ƒ /api/youtube/chat` are
  dynamic).
- **LIVE chat is the default** (per user: "cut the fake chat out entirely — no
  movement unless it's real"). The feed connects to the hosts' real rooms and starts
  EMPTY; it only moves on real messages. `NEXT_PUBLIC_DATA_MODE=simulation` restores
  the old always-live demo crowd (sim engine kept intact behind the flag). See the
  "Live chat" section.
- **Verify in-browser via `preview_*` tools.** Screenshots are flaky AND `preview_resize`
  makes screenshots capture a cropped window — verify layout via `preview_eval`
  (`getBoundingClientRect` vs `window.innerWidth`), not screenshots, after resizing.
  The natural preview viewport is ~812 (below `lg`); the user is on ~1920.

## Real platforms / channels (in `src/lib/config.ts` `SITE`)
- YouTube `@MarketBubble`, channel id **`UC2Yw4-WyejthY7OLpbVX4Ug`** (also in `.env`
  `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID`). Twitch **`fazebanks`**, Kick **`ansem`**, X
  **`MarketBubble`**. `SOCIALS` order = **X · Twitch · Kick · YouTube** (footer row).

## The stream — `src/app/api/youtube/route.ts` + `cinematic-hero.tsx`
- **`/api/youtube`** (no API key): detects a current **live** broadcast (scrapes the
  `/live` watch page for `isLive` + canonical), else returns the **most-recent
  LONG-FORM upload** from the channel RSS — **skips Shorts** by probing
  `youtube.com/shorts/{id}` (200 = Short, redirect = long-form). Cached/revalidated.
- Hero + `/live` `StreamPlayer` fetch it via TanStack Query. **No source picker** (the
  YouTube/Twitch/Kick/HQ tabs were removed — they confused the product). The hero auto-picks:
  **live (`yt.live === true`) → the Twitch (`fazebanks`) live stream; not live → the
  most-recent YouTube episode (replay)**. `source` is a derived const, not state. Top-left
  shows a **LIVE** badge + uptime clock **only when live** (the REPLAY badge was removed — on
  replays the top-left is clean); the episode title still shows in the bottom title card.
- **Clean YouTube chrome** (user wants no YT UI): embed params
  `controls=0&rel=0&iv_load_policy=3&fs=0&disablekb=1&enablejsapi=1&loop=1&playlist=<id>`
  + a transparent hover/click **blocker div** over the iframe (kills hover title bar +
  end-screen). `modestbranding` is deprecated (no-op). A **custom mute toggle** drives the
  player via the IFrame API (`postMessage {event:'command',func:'unMute'/'mute'}`). The video
  otherwise **just plays normally** — no thumbnail facade, vignette, or zoom-crop on the
  stream (all tried, all rejected by the user: dark band "looks weird", zoom "don't like it",
  thumbnail "rather it just play"). The **Site intro** (see its section) now covers the
  YouTube title's initial load-flash site-wide; the brief flash YT shows on its own before
  auto-hiding is accepted.
- **Twitch-style layout, NOT full-bleed** (redesigned per user): the hero sits inside the
  page padding as a CSS grid `lg:grid-cols-[340px_minmax(0,1fr)] gap-3` — a **detached 340px
  chat column on the LEFT** (`col-start-1`, Twitch's chat width) with a 16:9 **player panel**
  (`aspect-video rounded-md border-black/10 bg-ink`, flat — no soft shadow, `col-start-2`)
  beside it on the right. (Was player-left/chat-right; flipped per user. The player's
  `col-start` is derived from `chatVisible` so cinema/collapsed single-column modes still
  land in col 1.) The chat is a **dark,
  Apple-style panel even on the light page** (per user): the `<aside>` carries a scoped
  `className="dark"`, so the obsidian-cardstock tokens flip *inside it only* → light text,
  vivid platform hues. Background is **`bg-ink`** (`258 12% 9%` = `rgb(22,20,26)`, the exact
  near-black of the player panel beside it — per user, flipped from the old graphite
  `bg-card`); **no paper texture** (solid, NOT `.cardstock`). The composer keeps its faint
  `bg-card/40` raised-input tint (shared component; ~imperceptible over ink). Its own border
  is explicit `border-white/10` (the `.dark`
  black→white flips are descendant-only, not self). Quiet "Stream chat" header strip +
  `<Feed showHeader={false} dense />` (no `overlay` prop). **Boxy platform styling**:
  everything in the stage is `rounded-md` (6px). Chat matches the player height (single
  grid row — there is nothing below the video). Stacks at `<lg` (chat `h-[440px]`).
- **Netflix-style title card OVER the stream** (replaced the Twitch info bar that sat
  *below* the video — user: "go back to the netflix like ui design over top of the
  stream… title card specifically with an expand and mute/unmute button"). Bottom of the
  player: gradient scrim (`from-black/85 via-black/40 to-transparent`) + eyebrow
  (BubbleMark + "MARKET BUBBLE" + **Latest episode** chip on replays — when live the
  top-left LIVE badge speaks instead) + big white serif headline + "Markets & Trading ·
  English". **Under the title, left-aligned** (Netflix billboard style): two
  `GlassButton`s only — **mute/unmute** (YouTube source only) and **expand**
  (inline→theater; in theater/cinema it toggles to exit). **Hover-reveal
  on `lg+`** (`group/stage` on the player div + `lg:opacity-0
  lg:group-hover/stage:opacity-100`), always visible `<lg`. Card renders in ALL modes
  (cinema's top-right chrome is now exit-only; its mute moved to the card). The cinema
  entry button (clapperboard) is gone — `mode="cinema"` machinery remains but has no UI
  entry. Viewers/msg-min `InfoStats` were dropped from the hero. LIVE badge + `LiveClock`
  sit top-left **over the video** only when live.
- **Fullscreen modes** (`mode` state `inline|theater|cinema`): theater = fixed overlay with
  video `flex-1` + solid 340px chat column (collapsible via header chevron / edge tab; info
  bar hidden); cinema = bare video + volume/exit chrome. Mechanism = reliable `fixed inset-0`
  overlay **+** best-effort native `requestFullscreen()` **+** a `fullscreenchange` listener
  time-guarded (>400ms) so a sandbox's instant enter/exit can't collapse it. The same iframe
  node is never remounted (no restart). **DO NOT use Framer `layout`** for this — it
  drifted/shrank because the hero re-renders constantly (sim `viewers`/`mpm`). Per-second
  tickers are isolated in `<LiveClock>`/`<InfoStats>` to limit re-renders.

## Header / top bar — `src/components/layout/topbar.tsx` (heavily iterated)
- One `h-16` `cardstock` strip, **no bottom border**, `px-4 lg:px-6` (aligns the brand
  plate with content left edge). Hamburger, search, ON AIR, msg/min, bell are **gone**.
- Left: **brand plate** (BubbleMark + "Market Bubble", `bg-ink`). Middle: a cross-fade
  zone (`flex-[4]`): at page top it shows the **rotating headline banner**
  (`<HeadlineChyron noPlate>` — platinum `.chyron`) with the world clocks alongside;
  **once you scroll** (`main.scrollTop > 8`) it fades to the **live HQ Newsdesk alerts**
  crawling R→L (`<NewsTicker bare>`) and the clocks collapse to free up the width.
  Alerts/headline are trimmed to end ~53% of the width.
- Right: **clocks with symmetric breathing room** (`px-5` inside the collapsing wrapper →
  32px visual gap off the chyron plate AND the theme toggle; city dividers `mx-4`; the
  collapse cap is `max-w-[460px]` — keep it above the padded clocks' width or they clip),
  then the **dark-mode toggle** (`ThemeToggle`) next to **Join HQ** (or member chip),
  pinned far right. All `lg:`-gated (clocks hide `<lg`).

## Dark mode (real now — was previously a no-op)
- `ThemeToggle` (`src/components/layout/theme-toggle.tsx`) toggles `.dark` on `<html>`,
  persists to `localStorage 'mb-theme'`. `layout.tsx` removed the hardcoded `dark` class
  (**default = light**) and runs an inline no-flash script that applies the saved theme.
  (Tried dark-as-default once — user rejected; only the chat box is dark, see "The stream".)
- `globals.css` has an **unlayered `.dark` block at the very end**: graphite "obsidian
  cardstock" tokens + the paper grain on `.cardstock`. ⚠️ The app uses `black/[0.0X]`
  for subtle borders/fills (tuned for light paper) — the `.dark` block **flips an
  enumerated list of them to white-on-dark** (`.dark .border-black\/\[0\.06\]` etc.). If
  you add new `black/[..]` utilities, add a matching `.dark` flip or they vanish on dark.
- Bright business-card popups (login modal `bg-paper`, welcome `.paper-card`) are
  **intentionally left light** to pop over the dark desk (avoids `--paper`/`text-paper`
  token conflicts).

## Chat — Twitch-style (`src/components/feed/message-row.tsx`, `composer.tsx`)
- **Inline single line per message**: `[time] [platform glyph] **ColoredUsername**: text`
  flowing + wrapping, `$TICKER`/`@mention`/role badge inline. **12px**, dense (`py-[2px]`),
  `gap-0` between rows (Twitch density). **No avatars, no left accent bars** (colored
  username + glyph carry the platform). HQ msgs keep the gold tint.
- **No "Live Chat" header** on the overlay. Composer placeholder = **"Send a message"**;
  logged-out it renders a real-looking input that opens the **login popup** on click.
- `message-row` has an `overlay` prop → `lg:` white-on-dark styling for the video overlay.

## Community page = "The Lounge" (`/feed`) — Discord hangout, FULLY BRANDED
- **`src/components/community/lounge.tsx`** — a full-height premium Discord hangout inset
  on the desk (`p-3 lg:p-4` wrapper → `rounded-xl border bg-card` slab with a soft
  raised shadow). ⚠️ **NOT a forced-dark obsidian slab anymore** — the user rejected the
  all-black look ("it doesn't have to be black, there's an option to switch to dark mode
  for a reason… make it the same branding as everything else"). It now uses the site's
  **own theme tokens** (cardstock rails, `bg-card` feed, gold/red/platform accents, paper
  grain) so it reads on the **light desk AND flips with the dark-mode toggle** like every
  other page. Rails carry the `cardstock` class (same paper surface as the sidebar/topbar).
- ⚠️ **NO platform/source filtering** — an even earlier version had per-platform channels
  (`#kick`, `#twitch`…); rejected. Then a single `#the-floor` room with an "On air" host
  presence list — also rejected ("remove on air completely this is whack… add more
  channels like general, memes, stocks, crypto, nfts, voice chat"). So it's now a **real
  Discord channel list** of TOPIC channels, no host presence.
- **Channels** (`lounge-channels.ts`): TEXT = `general` (default) · `memes` · `stocks` ·
  `crypto` · `nfts`, plus a VOICE channel `voice-chat`. Each has `topic` + `welcome` (+
  optional `hand` marker-line). `craftChannelMessage(id)` reuses `engine.ts`'s
  `craftMessage` for a real roster identity but swaps in **channel-flavored content** from
  `CHANNEL_PHRASES` (memes = degen/emote, stocks = `{T}` equities, crypto = `{C}`
  BTC/ETH/SOL, nfts = floor/mint, general = gm/banter). `VOICE_MEMBERS` = a stable handful
  of online roster users "sitting in voice".
- **Lively with bots** (`use-lounge-feed.ts`) — the hero chat + Chat Terminal are
  LIVE-only (hard rule), but the Community page is filled with bots. The hook keeps a
  **per-channel buffer**: seeds every text channel once (`seedChannel`, ~20–42 msgs spread
  over ~3h with author clusters; host tweets only in `general`), then drips ONLY the active
  text channel (`~3–7s`, capped 180; `craftHostTweet` into general). Returns `messages`
  (active channel), `floor` (merged recent across channels, for the member list), `hide`,
  and `onFloor` (unique speakers + online-roster count). Voice channel has no drip.
  - **Channel rail** (`channel-rail.tsx`, 236px, `lg+`, `cardstock`): header (`#` plate +
    "The Floor" + `{onFloor} on the floor`) · **Text channels** list (active = neutral
    `bg-black/[0.06]`, hash in `text-hq`) · **Voice channels** = `voice-chat` with the
    `VOICE_MEMBERS` nested under it (small avatar + mic-off icon or animated emerald
    speaking bars via the `float` keyframe). Bottom **user bar** (Doodle pfp + pts / Join HQ).
  - **Lounge feed** (`lounge-feed.tsx` + `lounge-message.tsx`): header (`#{channel.name}` +
    `channel.topic` + emerald "live" chip + local search + members toggle), **Discord-scale
    grouped messages** — 40px **nft avatars**, platform-colored author header (X→ink),
    same-author/platform lines within 5 min grouped, **day dividers**, quiet hover row
    actions (react · reply · **hide**), host tweets as cards. Per-channel "Welcome to
    #name" hero (gradient hash tile + Playfair + optional red `font-hand`). Auto-follow
    re-pins on `channel.id` change. Shared `Composer` `placeholder={`Message #${name}`}`.
  - **Voice stage** (`voice-stage.tsx`) — shown instead of the feed when `channel.kind ===
    "voice"`: a Discord voice room — participant tiles (avatar + speaking ring + mic-off
    badge; a drifting `speaking` set animates the rings), header "N in voice", and a
    control dock (**Join voice** → login-gated; once joined: mute / deafen / Leave + your
    own Doodle tile). No text composer.
  - **Member rail** (`member-rail.tsx`, 252px, `cardstock`, toggleable): tabs **Members |
    Bubbles**. Members = Hosts (presence dot from their main room) · Bubbles (emerald dot) ·
    "On the floor" = speakers from the merged `floor` buffer. Bubbles tab = `<BubblesPanel/>`.
- **State**: `channelId` + `query` + `showMembers` in `lounge.tsx`; per-channel buffers +
  `hide(id)` in `use-lounge-feed.ts`. hq-store untouched (selectUser still opens the global
  ProfilePanel — bot users are real roster ids, so they resolve).
- Note: the app's own `<Sidebar/>` is also an `<aside>`, so when inspecting, the lounge's
  ChannelRail/MemberRail are `aside[1]`/`aside[2]`, not `[0]`.

## Chat Terminal (flagship — the $10k Vibe Code Challenge build)
- **What**: the hero chat panel expands leftward into a full-screen, broadcast-grade
  **unified chat command center** (`src/components/terminal/`). Two surfaces in one:
  the **operator desk** (filters/curation for the hosts mid-show) and **Broadcast
  clean mode** (an OBS-croppable on-stream view for the center box of their stream
  layout, ≈945×540 on a 1920 canvas — between the host cams).
- **Open it**: right-edge tab floating in the gutter beside the hero chat (`lg+` — the
  chat now sits on the LEFT, so the tab is on its right edge pointing inward via
  `right-0 translate-x-full` + `ChevronsRight`), or the expand icon in the chat header
  (`<lg` too). Opening from theater/cinema calls
  `exitFull()` first (no overlay stacking / Esc races). Esc steps broadcast →
  operator → closed. Overlay = `fixed inset-0 z-[120] .dark`-scoped; entrance is a
  one-shot **clip-path reveal from the right** (reads as the chat growing leftward —
  NOT Framer `layout`, same drift gotcha as the hero).
- **Data model**: `Platform` gained **`"youtube"`** end-to-end (tokens `--youtube`
  hue-0 "video red" ≠ HQ's hue-4 editorial red; glyph in `platform-icon.tsx`; ratios/
  seeds/timeseries/roster/settings all enumerate it). New **`HostId = ansem | banks |
  marketbubble`** + required **`ChatMessage.source`** — every message is tagged with
  whose room it came from. `HOSTS` (gold/platinum/red host accents — deliberately ≠
  platform colors), `SOURCE_PAIRS` (the 7 platform:host rooms: kick:ansem, x:ansem,
  twitch:banks, x:banks, youtube:marketbubble, x:marketbubble, hq:marketbubble) and
  `hostForPlatform()` live in `config.ts`. Sim (`engine.ts`), live adapters and
  `sendNative` all assign `source`; lexicon gained `{HOST}`-aware **question
  templates** + `makeYouTubeName`. `src/lib/data/signals.ts` = shared `isQuestion` /
  `isHighSignal` (scored, threshold ≥3) / `isSpamLike` heuristics.
- **Host tweets** (inline, like the reference broadcast-chat): new
  **`MessageKind "tweet"`** — the hosts' OWN X posts drop into the unified feed as
  longer-form **tweet cards** (avatar + name + verified ✓ + `@handle` + body +
  ticker chips), authored BY the host (platform `x`, `source` = the host, role
  `founder`, `userId` `host_<id>`). Content = `HOST_TWEETS` in `lexicon.ts` (Ansem
  macro/crypto · Banks trading · Market Bubble editorial), generated by
  `craftHostTweet()` in `engine.ts`; sprinkled into `backfill()` and emitted by
  `SimulationSource` every ~22–42s. `HostMeta.handle` (blknoiz06 / fazebanks /
  MarketBubble) + `HostAvatar` (`src/components/brand/host-avatar.tsx`, MB = ink
  BubbleMark, others = accent monogram, theme-safe). Rendered as cards in
  `terminal-row.tsx` (operator + em-scaled broadcast variants) and `message-row.tsx`
  (small chat / Community feed, token-themed). Tweets respect the Source Matrix
  (`x:ansem` etc.), count toward trending tickers, but are excluded from
  most-active / top-questions / Bubbles (those filter `kind === "chat"`).
- **State**: `src/store/terminal-store.ts` — fully independent of hq-store (the small
  chat + Community page filters are untouched). Sources matrix toggles (keyed
  `platform:host`, double-click = solo), ticker/questions/high-signal/mods filters,
  search, paused, slowMode (0/2/5/10s), broadcastMode, **pinned + queue hold full
  `ChatMessage` snapshots** (NOT ids — the 220-cap buffer evicts ids in minutes).
  `selectTerminalMessages` respects hq `hiddenIds`/`m.hidden` (mod actions are
  global); broadcast mode additionally drops spam-like + flagged.
- **Pause/slow** (`use-terminal-feed.ts`): freeze/sample a local snapshot — never
  touches global `running`; buffered count compares **timestamps** (not lengths —
  the sliding cap lies). One hq subscription, intervals read via ref.
- **Layout**: topbar (brand plate · debounced search · velocity meter · Hold / Slow
  cycle / Broadcast / collapse) over `lg:[248px matrix | feed] xl:[… | 312px rail]`;
  feed rows capped `max-w-[920px]` centered; `<lg` the rails become in-section
  slide-overs (NO Radix portals inside the terminal — portals land outside the
  `.dark` scope at z-50). Rail panels (each isolated): On-Air Queue (queue[0] = red
  ON AIR card), Top Questions, Hot Tickers, Velocity (+ per-host 60s bars).
- **Broadcast mode**: solid obsidian, gold hairline frame + corner ticks, slim
  Playfair header plate + LIVE cluster, feed type scales `clamp(15px,1.7vw,24px)`
  (reads at the 945×540 box AND full screen), `.chyron` platinum lower-third with
  red **ON AIR** end-tab (queue[0]) or gold **PINNED** tab + attribution "— user ·
  Host on Platform"; ghost exit button (hover-only, invisible on capture).
- **Terminal styling rule**: dark-scoped surfaces use `white/N` utilities ONLY
  (`black/[0.0X]` would vanish — grep `black/\[` in `src/components/terminal/` must
  stay empty).
- Known cosmetic side-effect of adding youtube to the seeded roster: the fake-user
  names reshuffled (PRNG draw order). Live-mode X host attribution is a weighted
  guess until a real X relay passes the account into `liveMessage`.

## Demo / test mode (for Loom / proof-of-concept recordings)
- The chat is real-only by default, but `src/lib/demo.ts` adds a **Demo mode** that
  flips the whole feed back to the lively simulation crowd (bots across all 5
  platforms + host tweets + trending), without editing env files.
  - Turn on: the **Settings → Data Source** toggle, or open any page with **`?demo=1`**
    (persisted to `localStorage 'mb-demo'` by `syncDemoFromUrl()` in `app-shell`, so
    it survives client nav; `?demo=0` turns it off). `setDemoMode()` writes the flag
    and reloads so the controller re-wires sources cleanly.
  - `effectiveDataMode()` = `isDemoMode() ? "simulation" : DATA_MODE` — the controller
    (`controller.ts`) and `createChatSources()` (`adapters.ts`) both read it instead of
    the static env `DATA_MODE`. Demo seeds `backfill(60)` so the feed is busy instantly.
  - **No on-screen badge** (per user — it must not show "demo mode" anywhere); you
    toggle it off via Settings or `?demo=0`. In demo mode no real-status dots appear
    (sim sets none) and the "Listening…" empty state never shows (the feed is full).
    `useDemoMode()` is the SSR-safe hook (false→real after mount).
  - Verified: `?demo=1` → all 7 sources flowing + 3 host-tweet cards, persists across
    nav + reload, exit returns to the real backlog.

## Live chat — real rooms only (`src/lib/data/adapters.ts`, verified end-to-end)
- **Transports** (each reports state to `src/lib/data/live-status.ts`, shown as dots
  in the Source Matrix + the "Listening to the real rooms" empty states):
  - **Twitch (#fazebanks → Banks)**: anonymous IRC-over-WS (`justinfan` + `CAP REQ
    :twitch.tv/tags` → real display-names; badges map broadcaster→founder,
    moderator→mod, vip→vip). Reconnects w/ capped backoff. Proven with real traffic.
  - **Kick (Ansem)**: Pusher WS app key **`32cbd69e4b950bf97679`** (us2 cluster — the
    old key in the original adapter was dead), channel `chatrooms.{id}.v2`.
    **Chatroom id 108796898** is baked in (`KICK_CHATROOM_ID` in config, env-
    overridable `NEXT_PUBLIC_KICK_CHATROOM_ID`) because kick.com's channel API is
    Cloudflare-blocked server-side (PowerShell/node/WebFetch all 403; discovered via
    r.jina.ai). `[emote:id:name]` placeholders are rendered as the name; subscription
    verified live.
  - **YouTube (@MarketBubble)**: `YouTubeSource` polls `/api/youtube` (existing live
    detector) every 60s; when live, polls **`/api/youtube/chat`** — an innertube
    proxy (browser CORS blocks youtube.com): `youtubei/v1/next` → conversationBar
    continuation → `youtubei/v1/live_chat/get_live_chat` (public WEB key, no quota).
    First batch = recent real history; rolling continuation + server-recommended
    pollMs; dedup by id. ⚠️ logged-out watch/live_chat HTML no longer embeds the
    continuation — `next` is the only working path. Proven against a live stream.
  - **X**: `/api/x-stream` SSE relay polling the hosts' timelines (handles in
    `HOSTS[].handle`: blknoiz06 / fazebanks / MarketBubble) — **requires
    `X_BEARER_TOKEN`** in `.env.local`; without it the adapter probes
    `?probe=1` and honestly reports "Not configured" (no fake tweets in live mode).
    Emits `kind:"tweet"` with the proper host source.
- **History backfill** (per user: "it should have all the chat history from
  everywhere"): on connect, `controller.seedHistory()` gathers each source's
  optional `history()`, merges by timestamp, dedupes by id, and seeds the feed so
  it opens with the real backlog — not empty.
  - **Twitch** `history()` = `recent-messages.robotty.de/api/v2/recent-messages/
    {channel}?limit=200` (open CORS, real `tmi-sent-ts` + tags). Verified: xqc
    opened with **~18 min / 220 rows** of real ordered backlog. Twitch message ids
    are stable (`tw_{tagId}`) so a backlog message and its live echo collapse to one
    row (a shared `seen` set + the controller's id-dedupe both guard this — also
    fixes the React-StrictMode dev double-seed).
  - **Kick** has NO anonymous backlog when offline (`/chatrooms/{id}/messages` 404,
    `/channels/{slug}/messages` 500) — chat history is tied to the live session, so
    no `history()`; it flows live when streaming.
  - **YouTube**'s first `get_live_chat` batch already IS recent real history.
  - **X** timeline (recent posts) is history by nature (needs the token).
- Live mode starts EMPTY of fabricated chat (controller seeds `backfill(30)` only in
  simulation mode); the only thing that fills it is real backlog + real live.
  Auto-follow, stats (mpm), trending etc. all run off whatever real messages arrive.
- **Verifying real flow** without waiting for the hosts to go live: temporarily set
  `NEXT_PUBLIC_TWITCH_CHANNEL=<busy live channel>` and/or
  `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=UCSJ4gkVC6NrvII8umztf0Ow` (LofiGirl, 24/7 open
  chat) in `.env.local`, restart dev. Done once — real Twitch flooded the 220-cap
  buffer and real YT rows appeared with the MB badge. Remember to revert.
- Sim leftovers that still "move" by design (not chat): viewer-count random walk,
  seeded platform totals, market tape, Bubbles insights. The CHAT feed itself is
  pure.

## Marker-hand titles
- `.font-hand` utility (Caveat, `--font-hand`) in `globals.css`. **Widget titles**
  (`widget.tsx`) and **"Live Odds"** (`prediction-chips.tsx`) render red `text-hq font-hand`
  (~20-22px, natural case) with a **hand-drawn underline SVG** (confident single curve
  `d="M4 10 Q 120 3.5 236 4"`, `stroke=currentColor`, `preserveAspectRatio="none"`).

## Home layout (`src/app/(app)/page.tsx`) — `space-y-3 px-4 pb-4 pt-3 lg:px-6 lg:pb-6`
1. `CinematicHero` (Twitch-style contained stage: player card + detached 340px chat — see
   "The stream"; the old full-bleed `-mx` wrapper is gone).
2. `PredictionChips` ("Live Odds", crawls L→R `marquee-reverse`).
3. Stat tiles → widgets (Our Radar, Top Contributors, Trending Stocks) → Bubbles
   panel + Sentiment + Platform Breakdown → "Follow Market Bubble" `SocialLinks` footer.
- **Our Radar is a PINNED watchlist** (`radar-watchlist.tsx`, replaced the old
  velocity-sorted `fastest-growing.tsx`): $HYPE · $TTWO · $ZEC · $VVV · $NVDA, in that
  order (per user). **Rows use the exact Trending Stocks layout** (per user): bold
  `$TICKER` + mention-count chip, name under, `<Sparkline>`, signed % change. Price
  action comes from the session market via `watchlistSnapshot(tickers)` in
  `intelligence.ts`, pulled client-side every 2.2s (SSR would hydrate-mismatch the
  randomly-seeded market — same pattern as `TickerTape`). Mentions hold a stable
  baseline until a live `trendingTopics`/`trendingStocks` entry overrides per-row.
  HYPE/TTWO/ZEC/VVV were added to `TICKERS` in `lexicon.ts` so `extractTickers`
  (live) + sim chat can mention them. Since it's 5 rows next to Trending Stocks' 6
  (equal-height grid cards), the rows **stretch to fill the card** — the Widget gets
  `className="flex flex-col"` + `bodyClassName="min-h-0 flex-1 p-4"` in `page.tsx`,
  the list is `flex h-full flex-col` with `flex-1` rows, and the type is a notch
  bigger (ticker 15px, name 12px, change 13px, sparkline 72×26) — no dead space.
- The old separate `NewsTicker`/`HeadlineChyron` rows are gone (now in the header).

## App shell (`src/components/layout/app-shell.tsx`)
- `<Topbar/>` (full width) · `[<Sidebar/> | <main>]` · `<TickerTape/>` (MARKET WATCH,
  dark, STATIONARY) · ProfilePanel · BubblesDock · LoginModal · WelcomeMoment.
- **Sidebar** (`sidebar.tsx`): 74px icon rail (Home·Live·Community·Leaders·Pulse +
  Moderation·Settings). **Hamburger removed** → a fixed **pull-out arrow** on the left
  edge (vertically centered) toggles `sidebarOpen` (`w-0 ↔ w-[74px]`; arrow rides to
  `left-[74px]`). **Default collapsed** (`sidebarOpen: false`). `SidebarContent` (the
  sheet variant) is currently **dead code** (unused).

## Bubbles co-host (`src/components/bubbles/bubbles-dock.tsx`)
- Fixed bottom-right, `bottom-9` (feet line up with the MARKET WATCH ticker top). Resting
  = full cutout at **`scale 0.54`** + green "1" badge. Click → scales to 1 + chat bubble
  pops left (Ask Bubbles, login-gated). Persona: witty, finance-native, bull/bear + "not
  financial advice".
- **Two modes, one morphing bar** (`Mode` = `menu|chat|talk` in `bubbles-dock.tsx`, login-gated
  via `choose()`). At rest the card shows a **Talk | Chat** split bar (`ModeButton` ×2 — Talk
  left, Chat right). Picking one expands it and collapses the other to a small switch icon:
  **Chat** = thread + input bar with a tiny **mic icon on the left** (`ChatPanel`
  `onSwitchToVoice`); **Voice** = a stretched **waveform "talking effect"** bar with a tiny
  **chat icon on the right** (`VoiceConversation` `onSwitchToChat`). The two icons toggle
  chat↔voice directly (no trip back to the split bar).
- **Chat (OpenAI)** — `<ChatPanel>` (`src/components/bubbles/chat-panel.tsx`): a real text
  thread; you type, she replies. Hits `POST /api/bubbles/chat` (`openai` SDK, model
  `gpt-4o-mini`, override via `OPENAI_MODEL`; Bubbles persona system prompt) and passes a
  **live market context** string built from the store
  (`trendingStocks`/`trendingTopics`/`sentiment`). Needs **`OPENAI_API_KEY`**; without it the
  panel shows a "Connect OpenAI" state. (Swapped from Anthropic at the user's request — the
  `@anthropic-ai/sdk` dep was removed.)
- **Voice (ElevenLabs Conversational AI, hands-free)** — `<VoiceConversation>`
  (`src/components/bubbles/voice-conversation.tsx`): real-time WebRTC convo via
  `@elevenlabs/react` (`ConversationProvider` + `useConversation`). `GET
  /api/bubbles/conversation-token` mints a session token server-side (key never hits the
  client); the client `startSession({conversationToken, connectionType:"webrtc",
  overrides:{tts:{voiceId: bubblesVoiceId}}})` — so her **pinned voice is forced onto the
  agent** (requires overrides enabled in the agent's security settings). Needs an ElevenLabs
  **Conversational AI agent** created in their dashboard + its id in
  **`NEXT_PUBLIC_ELEVENLABS_AGENT_ID`**; without it the panel shows a "Connect a voice agent"
  state.
  - **Connect is hardened** (was flaky/silent): lifecycle callbacks
    (`onConnect/onDisconnect/onError`) live on the `useConversation()` hook (always
    registered) instead of buried in `startSession`. `start()` does an **explicit mic
    preflight** (`getUserMedia({audio:true})` then stops the track) so a blocked mic fails
    instantly with a clear message rather than deep in WebRTC. The minted token + an
    `onError` **auto-retry-once-without-the-voice-override** (via `tokenRef`/`retriedRef`/
    `reconnectRef`) means a rejected override (overrides not enabled in the agent's security
    settings) **no longer kills Talk** — she reconnects in the agent's default voice.
    `friendlyError()` maps raw SDK errors to actionable text (mic blocked / enable overrides).
  - The **"Start talking" CTA is `bg-ink` (black)**, not `bg-bubble` (the bronze accent) —
    the bronze token is still used everywhere else for Bubbles. Connected state stays the
    light `bg-black/[0.03]` bar holding the waveform; End call stays red `bg-hq`.
- **Her voice** is still **pinned** via `NEXT_PUBLIC_ELEVENLABS_VOICE_ID` (seeds
  `bubblesVoiceId` in the store; `localStorage 'mb-bubbles-voice'`). Current voice:
  **"seductive woman"** (`lytBmh0w1EFTnAlVex4J`). `POST /api/bubbles/speak` (one-shot TTS) +
  `GET /api/bubbles/voices` (catalog, force-dynamic) remain for synthesis/lookup. There is
  **no in-app voice picker** by design.

## Auth / community
- Store: `isLoggedIn`, `loginOpen`, `welcomeOpen`, `points`, `sidebarOpen`, `running` in
  `src/store/hq-store.ts`. Logged-out can watch/read; chat/react/Ask-Bubbles/points gated
  → `LoginModal` → `WelcomeMoment`. Leaders/levels/badges in `/leaders`.

## Brand / theme (don't regress)
- **Light "silver cardstock"** `--background: 250 8% 78%`; **paper grain** on body + every
  surface via `.textured`/`.cardstock` (`background-blend-mode: overlay; size: ~190px` —
  do NOT upscale). Real `.dark` graphite variant (see Dark mode).
- Fonts: Playfair (`.font-display`), Inter, JetBrains Mono (`.tabular`), Caveat (`.font-hand`).
- Colors: RED `--primary`/`--hq` (`4 72% 49%`). X black, Kick green, Twitch purple, **HQ
  gold** (`--gold`); brightened on dark. Logo `src/components/brand/logo.tsx` (`BubbleMark`;
  add `invert` on dark surfaces).
- Assets all transparent (Python/Pillow processed, one-off). Images pasted in chat can't be
  read as files — save into `public/brand/` first.
- **NFT PFPs**: `nft-avatar.tsx` blockies (seeded SVG identicons) stay the default
  member PFP for the crowd (Lounge, member rails, etc.). **Real blue-chip NFT images**
  live in `public/brand/nft/` (`ape`=BAYC #1, `doodle`=Doodle #1, `penguin`=Pudgy #420,
  `punk`=CryptoPunk #42, `mfer`=mfer #1 — downloaded from IPFS/larvalabs one-off).
  `UserAvatar` gained `nftSrc` (real image via `AvatarImage`, wins over `nft`) +
  `nftPixelated` (crisp nearest-neighbor for the low-res punk).
  - **"You" = the Doodle, pinned everywhere.** `src/lib/data/nft-pfp.ts` is the single
    source of truth: `MY_PFP` (doodle), `isMe(id?,name?)` (true for `u_noah`/`u_local`
    or name "Noah"), `rankPfp(id,i)` (leaderboard: me→doodle, others cycle the other
    four). Wired into the Top Contributors `Leaderboard`, topbar/sidebar chips, lounge
    `channel-rail` user bar, settings identity, stream/live "Noah" founder cards, and
    the `/leaders` podium #1 + your card + `profile-panel` (conditional via `isMe`).
    The Weekly MVP hero is `roster[1]` (NOT you) so it stays a blockie.
  - An earlier seeded-SVG generator (`nft-collections.tsx`) was rejected as "fakes" and
    deleted — use the real images.

## Site intro (logo reveal) — `src/components/brand/site-intro.tsx`
- Full-site **loading-screen intro**: a `fixed inset-0 z-[9999]` overlay (`bg-[#d9d8dd]`,
  matched to the paper tone) that plays a **letterpress logo press-in** clip on first paint,
  then cross-fades (650ms) to reveal the site. Mounted in **root `layout.tsx`** (after
  `<Providers>`) so it covers the *entire* site, and it conveniently masks the stream's
  initial YouTube-chrome flash.
- **The clip is 100% programmatically rendered — `scripts/render_intro.py`** (Python +
  Pillow + numpy, all installed; deterministic, seeded). NOT AI footage: paper texture is
  **spectrally synthesized from the brand banner itself** — a clean cardstock patch of
  `Market bubble banner.png` (crop 40,330→700,630) is high-passed, then a unique full-4K
  field is generated with the same frequency spectrum via random-phase FFT (two layers:
  native + 0.45× freq for broad undulation) → the banner's exact fiber character with zero
  tiling repetition. (Mirror-tiling the patch was tried first — visible woven repeats.) Plus
  a `paper-grain.png` accent, seeded fibers, radial lighting, bright tone. The wordmark is
  the literal `market-bubble-logo-2-black.png` composited with a letterpress deboss (ink @0.94 so grain
  whispers through + pressed-edge shadow above + light catch below + contact shadow that
  blooms then relaxes). Timeline (4.0s, 24fps, 96 frames — per user: "grander"): 0–0.75s
  stately beat of drifting paper → a **grand press** (ink lands over ~5 frames at 0.75–0.95s,
  scale 1.12→0.992→1.0 with a weighty recovery, shadows bloom slowly, settled by 1.45s;
  small wordmark `LOGO_W_4K=480` ≈12.5% of frame) → hold. A continuous
  eased **push-in (1.00→1.05)**
  is computed per frame as **float-precision crop boxes at 4K** → `resize(..., LANCZOS,
  box=floats)` → 1080p. Re-tune + re-render: `python scripts/render_intro.py stills` (3
  approval stills) / `render` (full encode). Verified: consecutive-frame diffs perfectly even
  (no jitter spikes).
- ⚠️ **Why frame-by-frame**: every other zoom approach shook — Framer tween (main-thread
  jitter), CSS compositor keyframe (live grain-resampling shimmer), ffmpeg `zoompan`
  (integer-pixel crop quantization). Only sub-pixel float rendering is smooth. Don't add any
  client-side transform/animation to the `<video>`.
- **Assets** (`public/brand/`): `intro.webm` (~520KB VP9, primary), `intro.mp4` (~2.2MB
  H.264 fallback), `intro-poster.jpg` (frame 1 → seamless start). The two old AI 4K sources
  (`Metal_stamp_*` ~13/11MB) are now fully unused — safe to delete to slim deploys.
- **Timing is wall-clock, NOT the video's `ended` event** (unreliable across headless/fast-
  play/slow-load). `HOLD_MS=2600` after the video starts `playing` + 650ms fade ≈ overlay
  gone at ~3.25s while the clip drifts until 4.0s → **motion outlives the overlay, no frozen
  frame**. `HARD_CAP_MS=4500` so it can never get stuck. Skippable (click anywhere → "Skip"
  hint), locks body scroll while up, restores on dismiss, **respects
  `prefers-reduced-motion`** (skips entirely). Shows on every full page load (root layout
  persists across client nav → no replay on in-app route changes). Note: headless preview
  pauses muted autoplay — verify timing via `preview_eval`, not screenshots (latency lands
  after dismiss).

## Gotchas (learned the hard way)
- **Marquee keyframes live in `globals.css`** (`marquee` / `marquee-reverse`); motion is
  driven via inline `style={{animation:...}}`, so Tailwind would purge them otherwise.
- **Dark mode `black/[..]` flips** — see Dark mode. New subtle black utilities need a
  matching `.dark` flip.
- **Hero fullscreen ≠ Framer `layout`** (it drifts due to frequent re-renders). Use the
  fixed-overlay + native-fullscreen approach. Keep per-second tickers in child components.
- **`preview_resize` distorts screenshots** — verify with `preview_eval` boxes.
- YouTube live detection scrapes `/live` HTML (fragile); Shorts skipped via `/shorts/{id}`
  probe; mute via IFrame API postMessage (`enablejsapi=1`).
- **Never run `npm run build` while the dev server is up** — it clobbers `.next`, the
  dev page loses ALL CSS (everything renders unstyled, the site intro gets stuck at
  opacity 1 swallowing clicks). Restart the dev server after building.
- New `black/[0.0X]` utilities under `.dark` need flips in globals.css — inside the
  terminal use `white/N` directly instead (see Chat Terminal styling rule).

## Open ideas / next steps
- Richer Bubbles via Claude API (`/api/bubbles` + `ANTHROPIC_API_KEY`) — heuristic fallback.
- Optionally give `/live` `StreamPlayer` the same clean-YT treatment (kept native controls
  there on purpose). Re-wire or delete dead `SidebarContent`. Real viewer counts if a
  YouTube Data API key is added.
- **Bubbles Chat + Voice — live**: Chat uses **`OPENAI_API_KEY`** (`gpt-4o-mini`); Voice uses
  the ElevenLabs Conversational AI agent in **`NEXT_PUBLIC_ELEVENLABS_AGENT_ID`**. Both keys
  are in `.env.local`. Later: stream Chat replies for a live typing feel; surface
  conversation transcript text (`useConversation().message`) in the Voice panel.
