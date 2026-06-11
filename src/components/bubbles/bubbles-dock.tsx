"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Mic, ArrowLeft } from "lucide-react";
import { useHQ } from "@/store/hq-store";
import { cn } from "@/lib/utils";
import { ChatPanel } from "./chat-panel";
import { VoiceConversation } from "./voice-conversation";

const GREETING = "Let's review the market together.";
const GOLD = "#a8843a"; // muted antique gold — premium, readable on the light card
const BASE_BOTTOM = 30; // px above the viewport floor — peeks over the MARKET WATCH ticker
const FLOOR_PEEK = 5; // px her hands drop BELOW the footer divider so she rests right on the line

/** One half of the resting Talk | Chat split bar — a solid black pill (white
 *  text/icon) that lights with a thin red→gold underline on hover. */
function ModeButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group/mb relative flex flex-1 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-white/10 bg-ink py-3 transition-colors duration-200 hover:border-white/25"
    >
      {/* underline accent — slides in on hover */}
      <span
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 transition-transform duration-200 group-hover/mb:scale-x-100"
        style={{ background: `linear-gradient(90deg, hsl(var(--hq)), ${GOLD})` }}
      />
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors duration-200 group-hover/mb:bg-white/15 group-hover/mb:text-white">
        {icon}
      </span>
      <span className="font-display text-[13px] font-bold uppercase tracking-[0.08em] text-white">
        {label}
      </span>
    </button>
  );
}

type Mode = "menu" | "chat" | "talk";

export function BubblesDock() {
  const isLoggedIn = useHQ((s) => s.isLoggedIn);
  const openLogin = useHQ((s) => s.openLogin);
  const bubblesVoiceId = useHQ((s) => s.bubblesVoiceId);
  const setBubblesSpeaking = useHQ((s) => s.setBubblesSpeaking);

  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const [idleTyped, setIdleTyped] = useState("");

  // One-shot spoken greeting on open. While she speaks, the store flag tells the
  // stream to duck its audio; we clear it when the clip ends (or fails to load).
  const greetingBusy = useRef(false);
  const greetingAudio = useRef<HTMLAudioElement | null>(null);

  // Three-stage reveal: peek (rest) → idle wave (hover) → full standing (click).
  const showFull = expanded;
  const showIdle = hovered && !expanded;
  const showPeek = !hovered && !expanded;

  // Typewriter for the hover greeting — a touch slower than the click greeting.
  useEffect(() => {
    if (!showIdle) {
      setIdleTyped("");
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setIdleTyped(GREETING.slice(0, i));
      if (i >= GREETING.length) clearInterval(id);
    }, 45);
    return () => clearInterval(id);
  }, [showIdle]);

  // Reset to the choice menu once she fully closes.
  useEffect(() => {
    if (!expanded) {
      const t = setTimeout(() => setMode("menu"), 250);
      return () => clearTimeout(t);
    }
  }, [expanded]);

  // Default: float over the MARKET WATCH ticker (BASE_BOTTOM). But once the
  // page's footer divider ([data-bubbles-floor]) scrolls up to her level, stick
  // her bottom to that line so she crests it and never sits over the footer.
  // Tracks the main scroll container + viewport/content resize; re-binds per route.
  const pathname = usePathname();
  const [dockBottom, setDockBottom] = useState(BASE_BOTTOM);
  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>("main.desk-scroll");
    const content = scroller?.firstElementChild ?? null;
    const recompute = () => {
      const floor = document.querySelector<HTMLElement>("[data-bubbles-floor]");
      if (!floor) return setDockBottom(BASE_BOTTOM);
      const dividerTop = floor.getBoundingClientRect().top; // the divider line, viewport coords
      // Drop her FLOOR_PEEK below the divider so she crests it (peeks up) rather
      // than standing on the line and jutting into the content above.
      setDockBottom(Math.max(BASE_BOTTOM, Math.round(window.innerHeight - dividerTop - FLOOR_PEEK)));
    };
    recompute();
    // Catch async layout settling (hero aspect-ratio, fonts, images) so she
    // lands correctly on first paint even when the footer is visible at rest.
    const raf = requestAnimationFrame(recompute);
    const timers = [setTimeout(recompute, 300), setTimeout(recompute, 1000)];
    scroller?.addEventListener("scroll", recompute, { passive: true });
    window.addEventListener("resize", recompute);
    const ro = content ? new ResizeObserver(recompute) : null;
    if (content && ro) ro.observe(content);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      scroller?.removeEventListener("scroll", recompute);
      window.removeEventListener("resize", recompute);
      ro?.disconnect();
    };
  }, [pathname]);

  const choose = (m: Exclude<Mode, "menu">) => {
    if (!isLoggedIn) return openLogin();
    setExpanded(true);
    setMode(m);
  };
  const close = () => {
    setExpanded(false);
    setMode("menu");
  };

  // Speak the greeting in Bubbles' pinned voice (one-shot ElevenLabs TTS). Sets
  // the global `bubblesSpeaking` flag so the hero ducks the stream, and releases
  // it the moment she's done so the stream comes back up.
  const speakGreeting = useCallback(async () => {
    if (greetingBusy.current) return;
    greetingBusy.current = true;
    try {
      const res = await fetch("/api/bubbles/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: GREETING, voiceId: bubblesVoiceId || undefined }),
      });
      if (!res.ok) {
        greetingBusy.current = false;
        return; // no voice key / upstream error → stay silent, don't duck
      }
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      greetingAudio.current = audio;
      const done = () => {
        setBubblesSpeaking(false);
        greetingBusy.current = false;
        greetingAudio.current = null;
        URL.revokeObjectURL(url);
      };
      audio.onended = done;
      audio.onerror = done;
      setBubblesSpeaking(true); // duck the stream just as playback begins
      await audio.play();
    } catch {
      setBubblesSpeaking(false);
      greetingBusy.current = false;
    }
  }, [bubblesVoiceId, setBubblesSpeaking]);

  // Toggle the card; speak the greeting only when opening it.
  const toggleOpen = () => {
    if (!expanded) speakGreeting();
    setExpanded((v) => !v);
  };

  return (
    <div
      className="pointer-events-none fixed right-6 z-40 hidden items-end md:flex"
      style={{ bottom: dockBottom }}
    >
      {/* Hover group — keeps the card up while the mouse travels from her to it.
          flex-row puts her on the right and the card to her left. */}
      <div
        className="pointer-events-auto flex flex-row items-end gap-3"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, x: 16, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 16, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              className="paper-card relative mb-[150px] w-[276px] overflow-hidden rounded-xl border border-black/[0.08] text-black"
            >
              {/* single thin red→gold accent line */}
              <div
                className="h-px w-full"
                style={{ background: `linear-gradient(90deg, hsl(var(--hq)), ${GOLD}, transparent)` }}
              />

              <div className="p-4">
                {/* header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {mode !== "menu" && (
                      <button
                        onClick={() => setMode("menu")}
                        aria-label="Back"
                        className="-ml-1 rounded p-0.5 text-black/40 transition-colors hover:text-black"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <div>
                      <div className="font-display text-[15px] font-bold leading-none tracking-wide text-black">
                        Bubbles
                      </div>
                      <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.24em] text-black/45">
                        Co-Host
                      </div>
                    </div>
                  </div>
                  {mode !== "menu" && (
                    <button
                      onClick={close}
                      aria-label="Close"
                      className="rounded p-0.5 text-black/35 transition-colors hover:text-black"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {mode === "menu" && (
                  <>
                    {/* Talk | Chat — the resting split bar. Pick one and it
                        expands; the other collapses to an icon inside that panel. */}
                    <div className="mt-4 flex items-stretch gap-2">
                      <ModeButton
                        icon={<Mic className="h-4 w-4" />}
                        label="Talk"
                        onClick={() => choose("talk")}
                      />
                      <ModeButton
                        icon={<MessageSquare className="h-4 w-4" />}
                        label="Chat"
                        onClick={() => choose("chat")}
                      />
                    </div>
                  </>
                )}

                {mode === "chat" && <ChatPanel onSwitchToVoice={() => setMode("talk")} />}

                {mode === "talk" && <VoiceConversation onSwitchToChat={() => setMode("chat")} />}
              </div>

              {/* pointer tail toward her */}
              <span className="absolute -bottom-1.5 right-7 h-3 w-3 rotate-45 border-b border-r border-black/[0.08] bg-[hsl(252_18%_92%)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Idle hover — a quick greeting bubble. Click her to open the full card. */}
        <AnimatePresence>
          {showIdle && (
            <motion.div
              initial={{ opacity: 0, x: 14, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 14, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="paper-card relative mb-[128px] max-w-[200px] rounded-2xl border border-black/[0.08] px-4 py-2.5 text-black"
            >
              <p className="min-h-[2.6em] font-display text-[13px] italic leading-snug text-black/85">
                {idleTyped}
                {idleTyped !== GREETING && (
                  <span className="ml-px inline-block animate-pulse not-italic" style={{ color: GOLD }}>
                    ▏
                  </span>
                )}
              </p>
              {/* pointer tail toward her */}
              <span className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-black/[0.08] bg-[hsl(252_18%_92%)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bubbles — three-stage reveal: peeks over the MARKET WATCH bar at rest,
            rises to the idle wave on hover, and stretches to the full standing
            graphic (with her card) on click. */}
        <button
          onClick={toggleOpen}
          aria-label="Bubbles co-host"
          className="relative transition-[width,height] duration-300 ease-out"
          style={{
            width: showFull ? 195 : showIdle ? 150 : 92,
            height: showFull ? 260 : showIdle ? 176 : 68,
          }}
        >
          {/* Rest — just peeking over the bar */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/bubbles-peek.png"
            alt="Bubbles — AI co-host"
            draggable={false}
            className={cn(
              "absolute bottom-0 right-0 h-[68px] w-auto origin-bottom-right select-none object-contain drop-shadow-[0_12px_22px_rgba(0,0,0,0.26)] transition-opacity duration-300",
              showPeek ? "opacity-100" : "opacity-0"
            )}
          />
          {/* Hover — the idle wave */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/bubbles-idle.png"
            alt="Bubbles — AI co-host"
            draggable={false}
            className={cn(
              "absolute bottom-[-2px] right-0 h-[176px] w-auto origin-bottom-right select-none object-contain drop-shadow-[0_14px_26px_rgba(0,0,0,0.28)] transition-opacity duration-300",
              // Pure opacity fade at full size — no scale/transform at all, so her
              // bottom physically cannot move during the animation.
              showIdle ? "opacity-100" : "opacity-0"
            )}
          />
          {/* Click — full standing graphic */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/bubbles.png"
            alt="Bubbles — AI co-host"
            draggable={false}
            className={cn(
              "absolute bottom-0 right-0 h-[260px] w-auto origin-bottom-right select-none object-contain drop-shadow-[0_18px_34px_rgba(0,0,0,0.28)] transition-opacity duration-300",
              showFull ? "opacity-100" : "opacity-0"
            )}
          />
        </button>
      </div>
    </div>
  );
}
