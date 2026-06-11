"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  MessagesSquare,
  ChevronLeft,
  ChevronsRight,
  Expand,
  Play,
  Pause,
  GripHorizontal,
  X,
} from "lucide-react";
import { useTerminal } from "@/store/terminal-store";
import { useHQ } from "@/store/hq-store";
import { Feed } from "@/components/feed/feed";
import { ChatTerminal } from "@/components/terminal/chat-terminal";
import { BubbleMark } from "@/components/brand/logo";
import { SITE } from "@/lib/config";
import type { FeaturedStream } from "@/app/api/youtube/route";
import { cn } from "@/lib/utils";

const TWITCH = process.env.NEXT_PUBLIC_TWITCH_CHANNEL || SITE.twitch;

export function CinematicHero() {
  // inline → normal · theater → fullscreen with chat + chrome · cinema → bare fullscreen video
  const [mode, setMode] = useState<"inline" | "theater" | "cinema">("inline");
  // Theater-mode chat column — collapsible so the stream can go edge-to-edge.
  const [chatOpen, setChatOpen] = useState(true);
  const [host, setHost] = useState<string | null>(null);

  // Featured YouTube stream: live broadcast if on-air, else the latest episode.
  const { data: yt } = useQuery<FeaturedStream>({
    queryKey: ["youtube-featured"],
    queryFn: async () => {
      const r = await fetch("/api/youtube");
      if (!r.ok) throw new Error("Failed to load featured stream");
      return r.json();
    },
    staleTime: 60_000,
    refetchInterval: 120_000, // pick up "going live" without a reload
  });

  useEffect(() => {
    setHost(window.location.hostname);
  }, []);

  // Fullscreen (theater/cinema). The reliable mechanism is a `fixed inset-0`
  // overlay on the same <section>, so the iframe is never remounted (the stream
  // keeps playing) and it always fills the viewport. Native fullscreen is layered
  // on top as a best-effort enhancement for true edge-to-edge cinema.
  const isFull = mode !== "inline";
  const cinema = mode === "cinema";
  const theater = mode === "theater";
  // Chat is shown inline, and in theater when not collapsed; hidden in cinema.
  const chatVisible = !cinema && (!theater || chatOpen);
  // Inline → chat is docked in the grid column. Theater → chat detaches into a
  // free-floating, transparent, draggable/resizable window over the full video.
  const dockedChat = chatVisible && !theater;
  const floatingChat = chatVisible && theater;
  const sectionRef = useRef<HTMLElement>(null);
  const enteredAt = useRef(0);

  // Custom volume control (YouTube chrome is hidden, so autoplay-muted needs its
  // own unmute) — driven via the IFrame API over postMessage (enablejsapi=1).
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [muted, setMuted] = useState(true);
  const ytCommand = (func: string, args: (string | number)[] = []) =>
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*"
    );
  const toggleMute = () => {
    if (muted) {
      ytCommand("unMute");
      ytCommand("setVolume", [100]);
    } else {
      ytCommand("mute");
    }
    setMuted((m) => !m);
  };

  // Click-the-stream play/pause — the click-blocker over the YouTube surface
  // drives the player via the IFrame API (play/pauseVideo) instead of letting
  // the click fall through to YouTube's own UI.
  const [playing, setPlaying] = useState(true);
  const togglePlay = () => {
    ytCommand(playing ? "pauseVideo" : "playVideo");
    setPlaying((p) => !p);
  };

  // Expand the chat panel into the full Chat Terminal. Leave OS/overlay
  // fullscreen first so the two overlays never stack (and never race on Esc).
  const openTerminal = useTerminal((s) => s.openTerminal);
  const handleExpand = () => {
    if (isFull) exitFull();
    openTerminal();
  };

  const enterFull = (target: "theater" | "cinema") => {
    enteredAt.current = Date.now();
    setChatOpen(true);
    setMode(target);
    const el = sectionRef.current as (HTMLElement & { webkitRequestFullscreen?: () => void }) | null;
    if (el && !document.fullscreenElement) {
      try {
        (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el);
      } catch {
        /* OS fullscreen unavailable — the fixed overlay still covers the viewport */
      }
    }
  };

  const exitFull = () => {
    setMode("inline");
    const doc = document as Document & {
      webkitFullscreenElement?: Element;
      webkitExitFullscreen?: () => void;
    };
    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      (doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc);
    }
  };

  // Collapse the overlay when the user leaves OS fullscreen via Esc/browser UI —
  // but ignore the instant enter→exit that headless/sandboxed contexts emit.
  useEffect(() => {
    const onChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element };
      const stillFull = doc.fullscreenElement || doc.webkitFullscreenElement;
      if (!stillFull && Date.now() - enteredAt.current > 400) setMode("inline");
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  // Esc + scroll-lock while the overlay is open (covers the case where OS
  // fullscreen never engaged, so there's no fullscreenchange to rely on).
  useEffect(() => {
    if (!isFull) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && exitFull();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFull]);

  // Fullscreen chrome auto-hide (native-player feel): the title card + controls
  // + badges show on pointer/key activity, then fade out after a few idle
  // seconds. Inline is untouched (it keeps the hover-reveal). Mouse-moves over
  // the YouTube surface still register because the click-blocker sits above the
  // iframe and bubbles the event up to the section.
  const [chromeActive, setChromeActive] = useState(true);
  useEffect(() => {
    if (!isFull) {
      setChromeActive(true);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const ping = () => {
      setChromeActive(true);
      clearTimeout(timer);
      timer = setTimeout(() => setChromeActive(false), 2600);
    };
    const el = sectionRef.current;
    ping(); // visible on entry, then start the idle countdown
    el?.addEventListener("mousemove", ping);
    el?.addEventListener("pointerdown", ping);
    el?.addEventListener("touchstart", ping, { passive: true });
    window.addEventListener("keydown", ping);
    return () => {
      clearTimeout(timer);
      el?.removeEventListener("mousemove", ping);
      el?.removeEventListener("pointerdown", ping);
      el?.removeEventListener("touchstart", ping);
      window.removeEventListener("keydown", ping);
    };
  }, [isFull]);

  // No source picker: if the channel is live, play the Twitch live stream;
  // otherwise play the most-recent YouTube episode (replay).
  const live = yt?.live === true;
  const source: "youtube" | "twitch" = live ? "twitch" : "youtube";

  const embed =
    source === "twitch"
      ? host
        ? `https://player.twitch.tv/?channel=${TWITCH}&parent=${host}&muted=true&autoplay=true`
        : null
      : yt?.videoId
        ? // controls/logo/related/annotations off + looped → a clean broadcast surface
          `https://www.youtube.com/embed/${yt.videoId}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3&fs=0&disablekb=1&playsinline=1&enablejsapi=1&loop=1&playlist=${yt.videoId}`
        : null;

  // A new embed always starts muted + auto-playing, so reset both toggles.
  useEffect(() => {
    setMuted(true);
    setPlaying(true);
  }, [embed]);

  // Duck the stream while Bubbles speaks her one-shot greeting, then bring it back
  // up. Only the YouTube replay carries audio here (Twitch is always muted), so
  // that's the only source we touch — via the same IFrame API postMessage.
  const bubblesSpeaking = useHQ((s) => s.bubblesSpeaking);
  const ducked = useRef(false);
  useEffect(() => {
    if (source !== "youtube" || !embed) return;
    if (bubblesSpeaking) {
      ytCommand("setVolume", [8]);
      ducked.current = true;
    } else if (ducked.current) {
      if (!muted) ytCommand("setVolume", [100]);
      ducked.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bubblesSpeaking, muted, source, embed]);

  // A YouTube source that isn't currently live is a replay of the latest episode.
  const isReplay = source === "youtube" && yt?.live === false && !!yt.videoId;
  const headline = source === "youtube" && yt?.title ? yt.title : "Pre-Market Breakdown";

  return (
    // Reserve an approximate footprint so the page below doesn't jump while the
    // section is promoted to the fullscreen top layer.
    <div className={cn(isFull && "lg:h-[560px]")}>
      <section
        ref={sectionRef}
        className={cn(
          "hero-stage",
          isFull ? "fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col bg-ink" : "relative"
        )}
      >
        <div
          className={cn(
            "flex min-h-0 flex-col",
            isFull
              ? "h-full lg:grid lg:gap-0"
              : "gap-3 lg:grid lg:items-stretch lg:gap-3",
            dockedChat
              ? "lg:grid-cols-[340px_minmax(0,1fr)]"
              : "lg:grid-cols-[minmax(0,1fr)]"
          )}
        >
          {/* ── Right: the player with the Netflix-style title card over it ── */}
          {/* row-start-1 on BOTH grid items: the player (col 2) is first in DOM, and
              auto-placement can't move the cursor back to col 1 — without the
              explicit row the chat would wrap to a phantom row 2. */}
          <div className={cn("flex min-w-0 flex-col lg:row-start-1", dockedChat ? "lg:col-start-2" : "lg:col-start-1", isFull && "h-full min-h-0")}>
            <div
              className={cn(
                "group/stage relative overflow-hidden bg-ink",
                isFull
                  ? "min-h-0 flex-1"
                  : "aspect-video rounded-md border border-black/10"
              )}
            >
              {embed ? (
                <iframe
                  key={embed}
                  ref={iframeRef}
                  src={embed}
                  title="Market Bubble live"
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              ) : (
                <BroadcastSurface />
              )}

              {/* Click-blocker over the YouTube surface: swallows hover/clicks so
                  its title bar and end-screen never appear, and turns a click into
                  a clean play/pause toggle via the IFrame API. */}
              {source === "youtube" && embed && (
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={playing ? "Pause" : "Play"}
                  className={cn(
                    "group/play absolute inset-0 z-10 flex items-center justify-center",
                    isFull && !chromeActive ? "cursor-none" : "cursor-pointer"
                  )}
                >
                  {/* Center affordance — persistent Play when paused, a quick
                      Pause flash on hover while playing. The transition is scoped
                      to the playing state so the paused indicator pops instantly
                      (never waits on a fade). */}
                  <span
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur",
                      // Paused → show the Play affordance instantly (no fade).
                      !playing && "opacity-100",
                      // Playing + fullscreen → follow the idle timer (fades with
                      // the rest of the chrome instead of clinging to hover).
                      playing && isFull && "transition-opacity duration-200",
                      playing && isFull && (chromeActive ? "opacity-90" : "opacity-0"),
                      // Playing + inline → a quick Pause hint on hover.
                      playing && !isFull &&
                        "opacity-0 transition-opacity duration-200 lg:group-hover/play:opacity-90"
                    )}
                  >
                    {playing ? (
                      <Pause className="h-7 w-7" />
                    ) : (
                      <Play className="h-7 w-7 translate-x-0.5" />
                    )}
                  </span>
                </button>
              )}

              {/* LIVE badge + uptime — only when actually live */}
              {!isReplay && (
                <div className={cn(
                  "absolute left-3 top-3 z-20 flex items-center gap-2 transition-opacity duration-300",
                  isFull && !chromeActive && "pointer-events-none opacity-0"
                )}>
                  <span className="flex items-center gap-1.5 rounded-md bg-hq px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    Live
                  </span>
                  <LiveClock />
                </div>
              )}

              {/* Theater close — small, top-right over the video */}
              {theater && (
                <button
                  onClick={exitFull}
                  className={cn(
                    "absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-md bg-black/55 px-2.5 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur transition hover:bg-black/75",
                    !chromeActive && "pointer-events-none opacity-0"
                  )}
                >
                  <Minimize2 className="h-3.5 w-3.5" /> Close
                </button>
              )}

              {/* Cinema chrome: exit only (mute lives on the title card) */}
              {cinema && (
                <button
                  onClick={exitFull}
                  className={cn(
                    "absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-md bg-black/55 px-3 py-2 text-xs font-medium text-white/90 backdrop-blur transition hover:bg-black/75",
                    !chromeActive && "pointer-events-none opacity-0"
                  )}
                >
                  <Minimize2 className="h-4 w-4" /> Exit cinema
                </button>
              )}

              {/* ── Netflix-style title card — OVER the stream, bottom scrim.
                   Hover-reveal on lg+ (fades in with the controls when the
                   pointer is on the player), always visible on touch. ── */}
              <div
                className={cn(
                  "pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-3.5 pt-20 transition-opacity duration-300 lg:px-5 lg:pb-4",
                  // Fullscreen → driven by the idle timer; inline → hover-reveal.
                  isFull
                    ? chromeActive
                      ? "opacity-100"
                      : "opacity-0"
                    : "lg:opacity-0 lg:group-hover/stage:opacity-100 lg:group-focus-within/stage:opacity-100"
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <BubbleMark className="h-3.5 w-3.5 invert" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/75">
                      Market Bubble
                    </span>
                    {/* When live, the top-left LIVE badge + clock already speak */}
                    {isReplay && (
                      <span className="rounded-[3px] bg-white/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/85">
                        Latest episode
                      </span>
                    )}
                  </div>
                  <h2 className="mt-1 truncate font-display text-lg font-bold leading-tight text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.65)] lg:text-2xl">
                    {headline}
                  </h2>
                  <div className="mt-1 hidden items-center gap-1.5 text-[11.5px] text-white/65 sm:flex">
                    <span className="font-medium">Markets & Trading</span>
                    <span aria-hidden>·</span>
                    <span>English</span>
                  </div>
                </div>

                {/* Controls under the title, Netflix-billboard style */}
                <div className={cn(
                  "mt-2.5 flex items-center gap-2",
                  isFull && !chromeActive ? "pointer-events-none" : "pointer-events-auto"
                )}>
                  <GlassButton
                    label={isFull ? "Exit fullscreen" : "Expand"}
                    onClick={() => (isFull ? exitFull() : enterFull("theater"))}
                    white
                  >
                    {isFull ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </GlassButton>
                  {source === "youtube" && embed && (
                    <GlassButton label={muted ? "Unmute" : "Mute"} onClick={toggleMute}>
                      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </GlassButton>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Left: detached chat column (Twitch-style) — inline only ─────── */}
          {dockedChat && (
            // Wrapper carries the grid-item sizing so the expand tab can float
            // outside the aside (which clips via overflow-hidden).
            <div
              className={cn(
                "relative flex min-h-0 flex-col lg:col-start-1 lg:row-start-1",
                isFull ? "h-[40dvh] lg:h-full" : "h-[440px] lg:h-auto"
              )}
            >
              {/* Expand tab — grows the chat rightward into the Chat Terminal */}
              <button
                onClick={handleExpand}
                aria-label="Open Chat Terminal"
                title="Open Chat Terminal"
                className="absolute right-0 top-1/2 z-20 hidden translate-x-full -translate-y-1/2 items-center justify-center rounded-r-xl border border-white/15 bg-black/55 px-1.5 py-3 text-white/90 shadow-lg backdrop-blur transition-colors hover:bg-black/80 lg:flex"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>

              <aside
                className={cn(
                  // Dark, Apple-style chat panel — scoped `.dark` so it renders graphite
                  // (light text, vivid platform hues) regardless of the page theme. Solid
                  // pure black (per user — a touch deeper than the player's `bg-ink`), NOT
                  // `.cardstock` → no paper texture. Its own border is set explicitly
                  // (the `.dark` flips are descendant-only, not self).
                  "dark flex min-h-0 flex-1 flex-col overflow-hidden bg-black text-foreground",
                  isFull
                    ? "border-t border-white/10 lg:border-l lg:border-t-0"
                    : "rounded-md border border-white/10"
                )}
              >
                {/* Chat header — Twitch's "Stream Chat" strip, premium-quiet */}
                <div className="flex h-10 shrink-0 items-center justify-between border-b border-black/[0.06] px-3">
                  <button
                    onClick={handleExpand}
                    aria-label="Open Chat Terminal"
                    title="Open Chat Terminal"
                    className="text-muted-foreground/60 transition-colors hover:text-foreground"
                  >
                    <Expand className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Stream chat
                  </span>
                  {theater ? (
                    <button
                      onClick={() => setChatOpen(false)}
                      aria-label="Collapse chat"
                      className="hidden text-muted-foreground/60 transition-colors hover:text-foreground lg:block"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="w-3.5" aria-hidden />
                  )}
                </div>

                <div className="min-h-0 flex-1">
                  <Feed showHeader={false} dense />
                </div>
              </aside>
            </div>
          )}
        </div>

        {/* Theater chat — a free-floating, transparent window over the stream */}
        {floatingChat && (
          <FloatingChat onCollapse={() => setChatOpen(false)} onOpenTerminal={handleExpand} />
        )}

        {/* Theater chat toggle — brings a collapsed chat back, edge-tab style */}
        {theater && !chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            aria-label="Show chat"
            className="absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-r-xl border border-white/15 bg-black/55 px-2 py-3 text-white/90 shadow-lg backdrop-blur transition-colors hover:bg-black/80 lg:flex"
          >
            <MessagesSquare className="h-4 w-4" />
          </button>
        )}
      </section>

      {/* The chat panel's full-screen alter ego — overlays everything when open */}
      <ChatTerminal />
    </div>
  );
}

type Rect = { x: number; y: number; w: number; h: number };

/** Theater-mode chat as a free-floating, transparent window: drag it by the
 *  header, resize from the bottom-right grip, place it anywhere over the stream.
 *  Lives inside the fullscreen `fixed inset-0` section, so its absolute coords
 *  map straight to viewport pixels. */
function FloatingChat({
  onCollapse,
  onOpenTerminal,
}: {
  onCollapse: () => void;
  onOpenTerminal: () => void;
}) {
  const MIN_W = 248;
  const MIN_H = 220;
  const [rect, setRect] = useState<Rect>({ x: 24, y: 96, w: 360, h: 520 });
  const drag = useRef<{ mode: "move" | "resize"; sx: number; sy: number; orig: Rect } | null>(null);

  // Size a sensible default off the viewport on first mount.
  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.round(Math.min(400, Math.max(300, vw * 0.24)));
    setRect({ x: 24, y: Math.round(vh * 0.14), w, h: Math.round(vh * 0.64) });
  }, []);

  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

  // Pointer-capture drag/resize: capture on the handle so move/up keep firing
  // even when the pointer races outside the window. `orig` snapshots the rect at
  // grab time, so the math never reads a stale render.
  const handlers = (mode: "move" | "resize") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* capture unavailable — drag still works while the pointer stays on the handle */
      }
      drag.current = { mode, sx: e.clientX, sy: e.clientY, orig: rect };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.sx;
      const dy = e.clientY - d.sy;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (d.mode === "move") {
        setRect((r) => ({
          ...r,
          x: clamp(d.orig.x + dx, 0, vw - d.orig.w),
          y: clamp(d.orig.y + dy, 0, vh - 44),
        }));
      } else {
        setRect((r) => ({
          ...r,
          w: clamp(d.orig.w + dx, MIN_W, vw - d.orig.x),
          h: clamp(d.orig.h + dy, MIN_H, vh - d.orig.y),
        }));
      }
    },
    onPointerUp: (e: React.PointerEvent) => {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* no capture to release */
      }
      drag.current = null;
    },
  });

  return (
    <div
      className="dark absolute z-30 flex flex-col overflow-hidden rounded-xl border border-white/15 bg-black/25 text-foreground shadow-2xl backdrop-blur-md"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
    >
      {/* Drag handle / header */}
      <div
        {...handlers("move")}
        className="flex h-9 shrink-0 cursor-grab touch-none select-none items-center justify-between gap-2 border-b border-white/10 bg-white/[0.04] px-2.5 active:cursor-grabbing"
      >
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onOpenTerminal}
          aria-label="Open Chat Terminal"
          title="Open Chat Terminal"
          className="text-white/55 transition-colors hover:text-white"
        >
          <Expand className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-1.5 text-white/70">
          <GripHorizontal className="h-3.5 w-3.5 opacity-50" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Stream chat</span>
        </div>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onCollapse}
          aria-label="Hide chat"
          title="Hide chat"
          className="text-white/55 transition-colors hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1">
        <Feed showHeader={false} dense overlay />
      </div>

      {/* Resize grip — bottom-right corner */}
      <div
        {...handlers("resize")}
        aria-label="Resize chat"
        className="absolute bottom-0 right-0 z-10 flex h-5 w-5 cursor-nwse-resize touch-none items-end justify-end p-1 text-white/40 transition-colors hover:text-white/80"
      >
        <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M9 1 L1 9 M9 5 L5 9" />
        </svg>
      </div>
    </div>
  );
}

/** Glassy player control for the over-video title card (Netflix chrome).
 *  `white` swaps to a solid white button (dark icon) so it reads as primary. */
function GlassButton({
  label,
  onClick,
  white = false,
  children,
}: {
  label: string;
  onClick: () => void;
  white?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-md border backdrop-blur transition-colors",
        white
          ? "border-black/10 bg-white text-black hover:bg-white/90"
          : "border-white/15 bg-black/55 text-white/90 hover:bg-black/80"
      )}
    >
      {children}
    </button>
  );
}

/** Self-contained uptime clock — owns its own interval so the hero doesn't
 *  re-render every second. */
function LiveClock() {
  const [elapsed, setElapsed] = useState(2026);
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const tc = `${String(Math.floor(elapsed / 3600)).padStart(2, "0")}:${String(
    Math.floor((elapsed % 3600) / 60)
  ).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  return (
    <span className="tabular rounded-md bg-black/50 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur">
      {tc}
    </span>
  );
}

/** The HQ broadcast surface — reads as a live channel even without a feed. */
function BroadcastSurface() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink">
      <div className="absolute inset-0 animate-gradient-pan bg-[radial-gradient(50%_60%_at_30%_25%,hsl(var(--hq)/0.28),transparent_60%),radial-gradient(50%_60%_at_75%_70%,hsl(var(--bubble)/0.22),transparent_60%)] bg-[length:200%_200%]" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(hsl(0_0%_100%/0.6)_1px,transparent_1px)] [background-size:100%_3px]" />

      {/* faux equalizer */}
      <div className="absolute bottom-24 left-1/2 flex -translate-x-1/2 items-end gap-1 opacity-50 lg:bottom-32">
        {Array.from({ length: 64 }).map((_, i) => (
          <span
            key={i}
            className="w-1 rounded-full bg-white/80"
            style={{
              height: `${Math.round(8 + Math.abs(Math.sin(i * 0.5)) * 44)}px`,
              animation: `float ${1 + (i % 6) * 0.18}s ease-in-out ${i * 0.03}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="relative">
          <BubbleMark className="h-20 w-20 invert" />
          <div className="absolute inset-0 -z-10 rounded-full bg-hq/40 blur-3xl" />
        </div>
        <div className="mt-5 font-display text-3xl font-bold tracking-tight text-white">
          Market Bubble
        </div>
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/55">
          The Community Broadcast
        </div>
      </div>
    </div>
  );
}
