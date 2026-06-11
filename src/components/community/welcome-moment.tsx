"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper } from "lucide-react";
import { useHQ } from "@/store/hq-store";
import { BubbleMark } from "@/components/brand/logo";
import { PlatformIcon } from "@/components/brand/platform-icon";
import { PLATFORM_ORDER, PLATFORMS } from "@/lib/config";

export function WelcomeMoment() {
  const open = useHQ((s) => s.welcomeOpen);
  const dismiss = useHQ((s) => s.dismissWelcome);
  const name = useHQ((s) => s.currentUser.displayName);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(dismiss, 8000);
    return () => clearTimeout(id);
  }, [open, dismiss]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-xl paper-card p-8 text-center"
          >
            <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-hq/20 blur-3xl" />
            <div className="relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center">
                <BubbleMark className="h-14 w-14" />
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-hq/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-hq">
                <PartyPopper className="h-3.5 w-3.5" /> Welcome to HQ
              </div>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink">
                Welcome, {name}.
              </h2>
              <p className="mx-auto mt-2 max-w-xs text-sm text-ink/70">
                You just joined the shared Market Bubble community. You&apos;re now
                chatting alongside:
              </p>
              <div className="mt-4 flex items-center justify-center gap-2.5">
                {PLATFORM_ORDER.map((p) => (
                  <div key={p} className="flex flex-col items-center gap-1">
                    <PlatformIcon platform={p} size="md" />
                    <span className="text-[10px] font-medium text-ink/60">{PLATFORMS[p].label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={dismiss}
                className="mt-6 rounded-lg bg-hq px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                Enter the room
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
