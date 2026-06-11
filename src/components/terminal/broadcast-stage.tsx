"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";
import { HOSTS, PLATFORMS } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useTerminal } from "@/store/terminal-store";
import { useTerminalFeed } from "./use-terminal-feed";
import { TerminalRow } from "./terminal-row";

/**
 * Broadcast clean mode — the on-stream view, designed to be window-captured in
 * OBS and cropped into the center-stage box of the show layout (≈945×540 on a
 * 1920 canvas, between the host cams). Everything that matters scales with the
 * viewport (clamp on vw), the background is solid edge-to-edge for clean crop
 * lines, and a gold hairline frame echoes the show's gold-on-black plates.
 * Zero operator chrome — the exit button only appears on hover.
 */
export function BroadcastStage() {
  const { messages } = useTerminalFeed();
  const pinned = useTerminal((s) => s.pinned);
  const queue = useTerminal((s) => s.queue);
  const toggleBroadcast = useTerminal((s) => s.toggleBroadcast);
  const onAir = queue.length > 0 ? queue[0] : null;

  // On stream the feed is always pinned to the latest message.
  const viewportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = viewportRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div
      data-broadcast-stage
      className="relative flex h-full w-full min-h-0 items-center justify-center overflow-hidden bg-[hsl(257_15%_6%)]"
    >
      {/* The 16:9 safe frame — the on-stream view is laid out inside the largest
          16:9 box that fits, centred, so a window-capture drops straight into a
          16:9 center box (the gold hairline is the alignment guide). The
          surround stays solid for clean letterbox crop lines. */}
      <div
        data-broadcast-frame-box
        className="relative aspect-video max-h-full overflow-hidden bg-[hsl(257_15%_6%)] [container-type:inline-size]"
        style={{ width: "min(100%, calc(100dvh * 16 / 9))" }}
      >
        {/* Cityscape backplate — the chat floats over the LA-night skyline.
            cover/center fills the 16:9 frame; the scrim tames the bright city
            lights so the white chat copy stays legible across the whole frame. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/brand/broadcast-bg.png)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-black/45 via-black/35 to-black/55"
        />

        {/* Gold hairline frame + corner ticks — the show's plate language */}
        <div
          aria-hidden
          data-broadcast-frame
          className="pointer-events-none absolute inset-[10px] z-10 rounded-[3px] border border-gold/30"
        />
        {(["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"] as const).map(
          (pos) => (
            <span
              key={pos}
              aria-hidden
              className={cn(
                "pointer-events-none absolute z-10 m-[10px] h-3.5 w-3.5 border-gold/80",
                pos
              )}
            />
          )
        )}

        {/* Cinematic insets — feed spans ~80% of the frame (≈10% gutters), with
            small top/bottom breathing room. Padding % is width-relative, so the
            top/bottom values read as ~8% / ~7% of the 16:9 frame height. */}
        <div className="relative z-0 flex h-full min-h-0 flex-col px-[10%] pb-[4%] pt-[4.5%]">
        {/* The feed — wide, premium type; ~7–8 messages, soft-faded at the top */}
        <div
          ref={viewportRef}
          className="no-scrollbar min-h-0 flex-1 overflow-y-auto py-[0.4em] [mask-image:linear-gradient(to_bottom,transparent_0%,#000_8%)]"
          style={{ fontSize: "clamp(13px, 1.7cqi, 34px)" }}
        >
          <div className="flex w-full flex-col justify-end gap-[1.4em]">
            {messages.slice(-14).map((m) => (
              <TerminalRow key={m.id} message={m} broadcast />
            ))}
          </div>
        </div>

        {/* Lower third */}
        {(onAir || pinned) && (
          <div
            className="shrink-0 pt-[0.5em]"
            style={{ fontSize: "clamp(15px, 1.7cqi, 30px)" }}
          >
            <div className="w-full space-y-[0.45em]">
              {onAir && pinned && pinned.id !== onAir.id && (
                <div className="flex items-center gap-[0.5em] rounded-md border border-gold/40 bg-black/55 px-[0.6em] py-[0.3em] backdrop-blur">
                  <span className="shrink-0 text-[0.4em] font-bold uppercase tracking-[0.22em] text-gold">
                    Pinned
                  </span>
                  <p className="min-w-0 flex-1 truncate text-[0.55em] text-white/90">
                    {pinned.content}
                    <span className="text-white/45"> — {pinned.displayName}</span>
                  </p>
                </div>
              )}
              <LowerThird m={onAir ?? pinned!} mode={onAir ? "onair" : "pinned"} />
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Ghost exit — invisible on capture, appears on hover/focus */}
      <button
        onClick={toggleBroadcast}
        className="absolute right-4 top-4 z-20 rounded-md bg-black/60 px-3 py-1.5 text-xs font-medium text-white/90 opacity-0 backdrop-blur transition-opacity focus-visible:opacity-100 hover:opacity-100"
      >
        Exit broadcast
      </button>
    </div>
  );
}

/** The platinum chyron lower-third with a red ON AIR (or gold PINNED) end-tab. */
function LowerThird({ m, mode }: { m: ChatMessage; mode: "onair" | "pinned" }) {
  return (
    <div className="animate-chyron-up overflow-hidden rounded-md shadow-chyron">
      <div className="chyron flex items-stretch">
        <div
          className={cn(
            "flex shrink-0 items-center px-[0.7em]",
            mode === "onair" ? "bg-hq" : "bg-gold"
          )}
        >
          <span
            className={cn(
              "flex items-center gap-[0.4em] text-[0.42em] font-bold uppercase tracking-[0.22em]",
              mode === "onair" ? "text-white" : "text-ink"
            )}
          >
            {mode === "onair" && (
              <span className="h-[1em] w-[1em] animate-pulse rounded-full bg-white" aria-hidden />
            )}
            {mode === "onair" ? "On Air" : "Pinned"}
          </span>
        </div>
        <div className="min-w-0 flex-1 px-[0.75em] py-[0.45em]">
          <p className="line-clamp-2 text-[0.78em] font-semibold leading-snug">
            {m.content}
          </p>
          <p className="mt-[0.18em] truncate text-[0.42em] font-medium uppercase tracking-[0.16em] text-black/55">
            — {m.displayName} · {HOSTS[m.source].label} on {PLATFORMS[m.platform].label}
          </p>
        </div>
      </div>
    </div>
  );
}