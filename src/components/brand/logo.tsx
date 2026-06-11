"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// ─── Brand assets ────────────────────────────────────────────────────────────
// The official Market Bubble mark — a transparent black line-art logo that sits
// natively on the cardstock paper. On dark surfaces, pass `invert` to flip it
// white. Falls back to the serif speech-bubble SVG if the file is missing.

const MARK_SRC = "/brand/market-bubble-logo.png";

/**
 * The Market Bubble mark. `className` sets the box size (e.g. `h-9 w-9`). On a
 * dark background add `invert` to render the mark in white.
 */
export function BubbleMark({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <BubbleMarkSvg className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={MARK_SRC}
      alt="Market Bubble"
      draggable={false}
      onError={() => setFailed(true)}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

/** The serif speech-bubble + chart-arrow mark (vector fallback, recolorable). */
export function BubbleMarkSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 44" className={cn("h-9 w-9", className)} aria-hidden>
      <path
        d="M9 5h26a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H22l-8 7v-7h-5a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4Z"
        fill="hsl(26 14% 7%)"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 26l6.5-6 4.5 3 7.5-9"
        fill="none"
        stroke="hsl(4 76% 53%)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26 14h5v5"
        fill="none"
        stroke="hsl(4 76% 53%)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Full wordmark lockup (sidebar): the real mark + serif "Market Bubble" + HQ. */
export function Logo({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  if (collapsed) {
    return <BubbleMark className={cn("h-10 w-10", className)} />;
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <BubbleMark className="h-11 w-11" />
      <div className="leading-none">
        <div className="font-display text-[18px] font-semibold leading-[0.92] tracking-tight text-foreground">
          Market
          <br />
          Bubble
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="rounded-[3px] bg-gold px-1.5 py-[2px] text-[9px] font-bold tracking-[0.12em] text-ink">
            HQ
          </span>
          <span className="text-[8.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Community Desk
          </span>
        </div>
      </div>
    </div>
  );
}

/** Black broadcast logo plate (stream player chrome). */
export function LogoPlate({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-md border border-black/10 bg-ink px-3 py-2",
        className
      )}
    >
      <BubbleMark className="h-7 w-7 invert" />
      <div className="font-display text-[13px] font-semibold leading-[0.95] tracking-tight text-paper">
        Market
        <br />
        Bubble
      </div>
    </div>
  );
}
