"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTerminal } from "@/store/terminal-store";
import { TerminalTopbar } from "./terminal-topbar";
import { SourceMatrix } from "./source-matrix";
import { TerminalFeed } from "./terminal-feed";
import { TerminalRail } from "./terminal-rail";
import { BroadcastStage } from "./broadcast-stage";

/**
 * The Chat Terminal — the stream chat panel promoted to a full-screen,
 * broadcast-grade command center. A fixed overlay above everything but the
 * site intro; `.dark`-scoped like the chat panel it grows out of.
 *
 * Entrance: a one-shot clip-path reveal from the left edge (where the chat
 * column now lives), so it reads as the panel expanding rightward. Deliberately
 * NOT a Framer `layout` animation — the sim re-renders this tree constantly and
 * layout projection drifts (see the hero's history). Per-second widgets live
 * in isolated child subscribers.
 */
export function ChatTerminal() {
  const open = useTerminal((s) => s.open);
  const broadcastMode = useTerminal((s) => s.broadcastMode);
  const matrixCollapsed = useTerminal((s) => s.matrixCollapsed);
  const railCollapsed = useTerminal((s) => s.railCollapsed);
  const toggleMatrix = useTerminal((s) => s.toggleMatrix);
  const toggleRail = useTerminal((s) => s.toggleRail);
  const [mobilePanel, setMobilePanel] = useState<"sources" | "desk" | null>(null);

  // Finite set of literal grid templates (Tailwind needs them present to keep
  // the classes through purge). Collapsed rails shrink to a 52px control strip.
  const gridCols = cn(
    "grid-cols-[minmax(0,1fr)]",
    matrixCollapsed
      ? "lg:grid-cols-[52px_minmax(0,1fr)]"
      : "lg:grid-cols-[248px_minmax(0,1fr)]",
    matrixCollapsed && railCollapsed
      ? "xl:grid-cols-[52px_minmax(0,1fr)_52px]"
      : matrixCollapsed
        ? "xl:grid-cols-[52px_minmax(0,1fr)_312px]"
        : railCollapsed
          ? "xl:grid-cols-[248px_minmax(0,1fr)_52px]"
          : "xl:grid-cols-[248px_minmax(0,1fr)_312px]"
  );

  // Esc steps down: broadcast → operator desk → closed. Body scroll locks
  // while the terminal is up.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const t = useTerminal.getState();
      if (t.broadcastMode) t.toggleBroadcast();
      else t.closeTerminal();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) setMobilePanel(null);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          data-terminal-root
          className="dark fixed inset-0 z-[120] h-[100dvh] w-screen bg-[hsl(257_15%_7%)] text-foreground"
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          exit={{ clipPath: "inset(0 100% 0 0)" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="relative flex h-full min-h-0 flex-col"
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            {broadcastMode ? (
              <BroadcastStage />
            ) : (
              <>
                <TerminalTopbar
                  onSources={() => setMobilePanel("sources")}
                  onDesk={() => setMobilePanel("desk")}
                />
                <div className={cn("grid min-h-0 flex-1", gridCols)}>
                  {matrixCollapsed ? (
                    <CollapsedRail
                      side="left"
                      label="Sources"
                      onExpand={toggleMatrix}
                      className="lg:flex"
                    />
                  ) : (
                    <aside
                      data-terminal-matrix
                      className="hidden min-h-0 flex-col border-r border-white/10 lg:flex"
                    >
                      <RailStrip side="left" onCollapse={toggleMatrix} />
                      <div className="min-h-0 flex-1">
                        <SourceMatrix />
                      </div>
                    </aside>
                  )}
                  <TerminalFeed />
                  {railCollapsed ? (
                    <CollapsedRail
                      side="right"
                      label="Broadcast Desk"
                      onExpand={toggleRail}
                      className="xl:flex"
                    />
                  ) : (
                    <aside
                      data-terminal-rail
                      className="hidden min-h-0 flex-col border-l border-white/10 xl:flex"
                    >
                      <RailStrip side="right" onCollapse={toggleRail} />
                      <div className="min-h-0 flex-1">
                        <TerminalRail />
                      </div>
                    </aside>
                  )}
                </div>

                {/* Slide-over rails for narrow viewports — rendered inside the
                    terminal (no portals → no z-index / dark-scope traps). */}
                <AnimatePresence>
                  {mobilePanel && (
                    <>
                      <motion.button
                        aria-label="Close panel"
                        onClick={() => setMobilePanel(null)}
                        className="absolute inset-0 z-30 bg-black/60"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                      <motion.div
                        data-terminal-sheet={mobilePanel}
                        className={cn(
                          "absolute inset-y-0 z-40 flex w-[300px] max-w-[85vw] flex-col bg-[hsl(257_15%_9%)] shadow-2xl",
                          mobilePanel === "sources"
                            ? "left-0 border-r border-white/10"
                            : "right-0 border-l border-white/10"
                        )}
                        initial={{ x: mobilePanel === "sources" ? -320 : 320 }}
                        animate={{ x: 0 }}
                        exit={{ x: mobilePanel === "sources" ? -320 : 320 }}
                        transition={{ type: "spring", stiffness: 380, damping: 36 }}
                      >
                        <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 px-4">
                          <span className="eyebrow text-white/40">
                            {mobilePanel === "sources" ? "Source Matrix" : "Desk"}
                          </span>
                          <button
                            onClick={() => setMobilePanel(null)}
                            aria-label="Close"
                            className="rounded p-1 text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="min-h-0 flex-1">
                          {mobilePanel === "sources" ? <SourceMatrix /> : <TerminalRail />}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

/** Thin control strip atop an expanded rail — just the minimize chevron, set
    against the rail's inner edge (no title; the rail's own sections label it). */
function RailStrip({
  side,
  onCollapse,
}: {
  side: "left" | "right";
  onCollapse: () => void;
}) {
  const Icon = side === "left" ? PanelLeftClose : PanelRightClose;
  return (
    <div
      className={cn(
        "flex h-9 shrink-0 items-center border-b border-white/10 px-2",
        side === "left" ? "justify-end" : "justify-start"
      )}
    >
      <button
        onClick={onCollapse}
        aria-label="Minimize panel"
        title="Minimize panel"
        className="flex h-7 w-7 items-center justify-center rounded-md text-white/45 transition-colors hover:bg-white/[0.08] hover:text-white"
      >
        <Icon className="h-4 w-4" />
      </button>
    </div>
  );
}

/** A minimized rail — a slim column with an expand control + vertical label. */
function CollapsedRail({
  side,
  label,
  onExpand,
  className,
}: {
  side: "left" | "right";
  label: string;
  onExpand: () => void;
  className?: string;
}) {
  const Icon = side === "left" ? PanelLeftOpen : PanelRightOpen;
  return (
    <aside
      data-terminal-collapsed={side}
      className={cn(
        "hidden min-h-0 flex-col items-center gap-3 py-3",
        side === "left" ? "border-r border-white/10" : "border-l border-white/10",
        className
      )}
    >
      <button
        onClick={onExpand}
        aria-label={`Expand ${label}`}
        title={`Expand ${label}`}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
      >
        <Icon className="h-4 w-4" />
      </button>
      <span className="select-none text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40 [writing-mode:vertical-rl] [text-orientation:mixed]">
        {label}
      </span>
    </aside>
  );
}
