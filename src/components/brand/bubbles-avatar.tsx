"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * The Bubbles co-host mark — a polished champagne "bubble" with a calm,
 * concierge expression. Premium and on-brand (ink/ivory/champagne), not a
 * neon toy.
 */
export function BubblesAvatar({
  size = 40,
  pulse = true,
  className,
}: {
  size?: number;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {pulse && (
        <span className="absolute inset-0 rounded-full bg-bubble/35 blur-md animate-pulse-ring" />
      )}
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative h-full w-full"
      >
        <svg
          viewBox="0 0 48 48"
          className="h-full w-full drop-shadow-[0_0_10px_hsl(38_52%_60%/0.45)]"
        >
          <defs>
            <radialGradient id="bub-body" cx="36%" cy="30%" r="72%">
              <stop offset="0%" stopColor="hsl(44 70% 92%)" />
              <stop offset="48%" stopColor="hsl(38 54% 70%)" />
              <stop offset="100%" stopColor="hsl(32 45% 44%)" />
            </radialGradient>
            <radialGradient id="bub-shine" cx="32%" cy="24%" r="42%">
              <stop offset="0%" stopColor="white" stopOpacity="0.95" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="24" cy="24" r="18" fill="url(#bub-body)" />
          <circle cx="24" cy="24" r="18" fill="url(#bub-shine)" />
          {/* calm concierge expression */}
          <circle cx="18.5" cy="23" r="1.9" fill="hsl(26 30% 14%)" />
          <circle cx="29.5" cy="23" r="1.9" fill="hsl(26 30% 14%)" />
          <circle cx="17.9" cy="22.4" r="0.6" fill="white" />
          <circle cx="28.9" cy="22.4" r="0.6" fill="white" />
          <path
            d="M18.5 28.5c2 2 7 2 9 0"
            stroke="hsl(26 30% 14%)"
            strokeWidth="1.7"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </motion.div>
    </div>
  );
}
