"use client";

import { memo } from "react";
import { BadgeCheck, EyeOff, ListPlus, Pin } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { HOSTS, PLATFORMS } from "@/lib/config";
import { cn, formatClock, formatClockSeconds } from "@/lib/utils";
import { PlatformChip, PlatformGlyph } from "@/components/brand/platform-icon";
import { HostAvatar } from "@/components/brand/host-avatar";
import { MessageContent } from "@/components/feed/message-content";
import { useHQ } from "@/store/hq-store";
import { useTerminal } from "@/store/terminal-store";
import { HostBadge } from "./host-badge";

// Role chips, lifted a stop brighter than ROLE_META so they read on graphite.
const ROLE_DARK: Partial<Record<ChatMessage["role"], { label: string; class: string }>> = {
  founder: { label: "Founder", class: "text-hq" },
  mod: { label: "Mod", class: "text-emerald-400" },
  vip: { label: "VIP", class: "text-violet-400" },
};

/**
 * One terminal feed line: [hh:mm:ss] [platform] [host] [role] Username: text.
 * `broadcast` renders the clean on-stream variant — em-based sizing (driven by
 * the stage's viewport-scaled font), full host names, no actions or chips.
 */
export const TerminalRow = memo(function TerminalRow({
  message: m,
  broadcast = false,
}: {
  message: ChatMessage;
  broadcast?: boolean;
}) {
  const pin = useTerminal((s) => s.pin);
  const enqueue = useTerminal((s) => s.enqueue);
  const setTickerFilter = useTerminal((s) => s.setTickerFilter);
  const hideMessage = useHQ((s) => s.hideMessage);

  const color = PLATFORMS[m.platform].text;
  const role = ROLE_DARK[m.role];
  const sourceKey = `${m.platform}:${m.source}`;
  const hostAccent = HOSTS[m.source].accent;

  // ── A host's own tweet — a card, not a one-line chat row ──────────────────
  if (m.kind === "tweet") {
    if (broadcast) {
      // On-stream tweet — avatar + name + handle header, body wraps to ≤4 lines.
      return (
        <div
          data-mid={m.id}
          data-source={sourceKey}
          data-kind="tweet"
          className="flex items-start gap-[0.6em] rounded-[0.45em] border border-white/[0.09] bg-black/45 px-[0.75em] py-[0.55em]"
        >
          <HostAvatar
            host={m.source}
            className="h-[1.9em] w-[1.9em] text-[0.78em]"
            markClassName="h-[1.05em] w-[1.05em]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-[0.35em] leading-none">
              <span className={cn("font-bold", hostAccent)}>{m.displayName}</span>
              <BadgeCheck className="h-[0.78em] w-[0.78em] shrink-0 text-sky-400" />
              <span className="truncate text-[0.62em] text-white/40">@{m.username}</span>
              <PlatformGlyph platform="x" className="ml-auto h-[0.72em] w-[0.72em] shrink-0" />
            </div>
            <p className="mt-[0.3em] break-words leading-[1.34] text-white/90 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4] overflow-hidden">
              <MessageContent text={m.content} />
            </p>
          </div>
        </div>
      );
    }
    // Operator tweet card.
    return (
      <div
        data-mid={m.id}
        data-source={sourceKey}
        data-kind="tweet"
        className="group relative my-1 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2.5 transition-colors hover:bg-white/[0.05]"
      >
        <div className="flex items-start gap-2.5">
          <HostAvatar host={m.source} className="h-9 w-9 text-[14px]" markClassName="h-5 w-5" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className={cn("text-[13px] font-bold", hostAccent)}>{m.displayName}</span>
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-400" />
              <span className="text-[12px] text-white/40">@{m.username}</span>
              <span className="text-white/25">·</span>
              <PlatformGlyph platform="x" className="h-3 w-3" />
              <span className="text-[11px] text-white/35">posted</span>
              <span className="ml-auto flex items-center gap-1.5">
                <HostBadge host={m.source} />
                <span className="font-mono text-[10px] tabular-nums text-white/30">
                  {formatClock(m.timestamp)}
                </span>
              </span>
            </div>
            <p className="mt-1 break-words text-[13.5px] leading-relaxed text-white/90">
              <MessageContent text={m.content} />
            </p>
            {m.tickers.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {m.tickers.slice(0, 4).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTickerFilter(t)}
                    title={`Filter feed to $${t}`}
                    className="rounded bg-white/[0.05] px-1.5 py-px font-mono text-[11px] font-semibold text-hq ring-1 ring-white/10 transition-colors hover:bg-hq/20"
                  >
                    ${t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Curation actions — pin / queue / hide, on hover only */}
        <div className="absolute right-1.5 top-1.5 hidden items-center gap-0.5 rounded-md border border-white/15 bg-[hsl(257_15%_10%)] p-0.5 shadow-lg group-hover:flex">
          <RowAction label="Pin tweet" onClick={() => pin(m)}>
            <Pin className="h-3 w-3" />
          </RowAction>
          <RowAction label="Add to on-air queue" onClick={() => enqueue(m)}>
            <ListPlus className="h-3 w-3" />
          </RowAction>
          <RowAction label="Hide tweet" onClick={() => hideMessage(m.id)}>
            <EyeOff className="h-3 w-3" />
          </RowAction>
        </div>
      </div>
    );
  }

  if (broadcast) {
    // On-stream ticker line — a wide, thin row with a soft dark wash (not an
    // app-card): faint border, dark-transparent fill, source pill + handle as
    // the focus. Messages cap at two lines. Everything is em-sized so it scales
    // with the capture.
    return (
      <div
        data-mid={m.id}
        data-source={sourceKey}
        className="flex items-center gap-[0.7em] rounded-[0.4em] border border-white/[0.05] bg-black/35 px-[0.8em] py-[0.3em]"
      >
        <PlatformChip platform={m.platform} em className="shrink-0" />
        <HostBadge host={m.source} em className="shrink-0" />
        <p className="min-w-0 flex-1 break-words leading-[1.32] line-clamp-2">
          <span className={cn("mr-[0.55em] font-bold", color)}>{m.displayName}</span>
          <span className="text-white/90">
            <MessageContent text={m.content} />
          </span>
        </p>
      </div>
    );
  }

  return (
    <div
      data-mid={m.id}
      data-source={sourceKey}
      className="group relative rounded-sm px-2 py-1 transition-colors hover:bg-white/[0.04]"
    >
      <div className="flex items-start gap-2">
        <span className="mt-[3px] shrink-0 font-mono text-[10px] tabular-nums text-white/30">
          {formatClockSeconds(m.timestamp)}
        </span>
        <PlatformGlyph
          platform={m.platform}
          className="mt-[2.5px] h-3.5 w-3.5 shrink-0"
        />
        <HostBadge host={m.source} className="mt-px" />
        <p className="min-w-0 flex-1 break-words text-[13.5px] leading-relaxed">
          {role && (
            <span
              className={cn(
                "mr-1.5 rounded-[3px] bg-white/[0.08] px-1 py-px align-middle text-[8px] font-bold uppercase tracking-wide",
                role.class
              )}
            >
              {role.label}
            </span>
          )}
          <span className={cn("font-bold", color)}>{m.displayName}</span>
          <span className="text-white/35">: </span>
          <span className="text-white/90">
            <MessageContent text={m.content} />
          </span>
        </p>
        {m.tickers.length > 0 && (
          <div className="mt-[2px] hidden shrink-0 items-center gap-1 transition-opacity group-hover:opacity-0 sm:flex">
            {m.tickers.slice(0, 2).map((t) => (
              <button
                key={t}
                onClick={() => setTickerFilter(t)}
                title={`Filter feed to $${t}`}
                className="rounded bg-white/[0.05] px-1 font-mono text-[10px] font-semibold text-hq ring-1 ring-white/10 transition-colors hover:bg-hq/20"
              >
                ${t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Curation actions — pin / queue / hide, on hover only */}
      <div className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-md border border-white/15 bg-[hsl(257_15%_10%)] p-0.5 shadow-lg group-hover:flex">
        <RowAction label="Pin message" onClick={() => pin(m)}>
          <Pin className="h-3 w-3" />
        </RowAction>
        <RowAction label="Add to on-air queue" onClick={() => enqueue(m)}>
          <ListPlus className="h-3 w-3" />
        </RowAction>
        <RowAction label="Hide message" onClick={() => hideMessage(m.id)}>
          <EyeOff className="h-3 w-3" />
        </RowAction>
      </div>
    </div>
  );
});

function RowAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-6 w-6 items-center justify-center rounded text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white"
    >
      {children}
    </button>
  );
}
