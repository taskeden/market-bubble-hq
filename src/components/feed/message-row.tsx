"use client";

import { memo, type ReactNode } from "react";
import { BadgeCheck, EyeOff, Flag, VolumeX, Heart } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { HOSTS, PLATFORMS, ROLE_META } from "@/lib/config";
import { cn, formatClock } from "@/lib/utils";
import { PlatformGlyph, PlatformChip } from "@/components/brand/platform-icon";
import { HostAvatar } from "@/components/brand/host-avatar";
import { MessageContent } from "./message-content";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHQ } from "@/store/hq-store";

/** Wraps any trigger (name or platform icon) so hovering reveals the source chip. */
function SourceHover({
  platform,
  children,
}: {
  platform: ChatMessage["platform"];
  children: ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="border-0 bg-transparent p-0 shadow-none backdrop-blur-none"
        >
          <PlatformChip platform={platform} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function MessageRowBase({
  message: m,
  dense,
  overlay,
}: {
  message: ChatMessage;
  dense?: boolean;
  overlay?: boolean;
}) {
  const meta = PLATFORMS[m.platform];
  const selectUser = useHQ((s) => s.selectUser);
  const hideMessage = useHQ((s) => s.hideMessage);
  const flagMessage = useHQ((s) => s.flagMessage);
  const muteUser = useHQ((s) => s.muteUser);
  const role = ROLE_META[m.role];
  const showRole = m.role !== "member" && m.role !== "bot";
  const isX = m.platform === "x";

  // ── A host's own tweet — a compact card that stands out from chat lines ────
  if (m.kind === "tweet") {
    return (
      <div
        className={cn(
          "group/msg relative my-1 rounded-lg border border-black/10 bg-card/50 px-2.5 py-2 transition-colors",
          overlay && "lg:border-white/15 lg:bg-white/[0.06] lg:[text-shadow:0_1px_1px_rgb(0_0_0/0.55)]"
        )}
      >
        <div className="flex items-start gap-2">
          <HostAvatar
            host={m.source}
            className="h-7 w-7 text-[11px]"
            markClassName="h-4 w-4"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 leading-none">
              <button
                onClick={() => selectUser(m.userId)}
                className={cn("text-[11.5px] font-bold hover:underline", HOSTS[m.source].accent, overlay && "lg:text-white")}
              >
                {m.displayName}
              </button>
              <BadgeCheck className="h-3 w-3 shrink-0 text-sky-500" />
              <span className={cn("truncate text-[10px] text-muted-foreground", overlay && "lg:text-white/55")}>
                @{m.username}
              </span>
              <PlatformGlyph
                platform="x"
                inherit
                className={cn("ml-auto h-3 w-3 shrink-0 text-foreground/70", overlay && "lg:text-white/80")}
              />
            </div>
            <p className={cn("mt-1 break-words text-[11.5px] leading-snug text-foreground/90", overlay && "lg:text-white/95")}>
              <MessageContent text={m.content} />
            </p>
          </div>
        </div>

        {/* Inline moderation actions */}
        <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-lg border border-black/10 bg-popover/90 p-0.5 opacity-0 shadow-lg backdrop-blur-md transition-opacity group-hover/msg:opacity-100">
          <button
            onClick={() => hideMessage(m.id)}
            aria-label="Hide"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-black/10 hover:text-foreground"
          >
            <EyeOff className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }
  // X has no light hue of its own — render it adaptively so its glyph + name read
  // white on dark surfaces (video overlay, dark mode) yet stay legible on the light
  // cardstock feed. Every other platform keeps its brand hue.
  const platformColor = isX
    ? cn("text-foreground", overlay && "lg:text-white")
    : meta.text;

  return (
    <div
      className={cn(
        // Compact Twitch-style chat: small type, tight rows.
        "group/msg relative rounded px-2 transition-colors hover:bg-black/[0.025]",
        dense ? "py-px" : "py-[2px]",
        m.platform === "hq" && "bg-gold/[0.05]",
        m.mentionsBubbles && m.platform !== "hq" && "bg-bubble/[0.04]",
        m.flagged && "bg-destructive/[0.06]",
        overlay && "lg:hover:bg-white/[0.06] lg:[text-shadow:0_1px_1px_rgb(0_0_0/0.55)]"
      )}
    >
      {/* Twitch-style inline message: time · badge · username: text … */}
      <p
        className={cn(
          "break-words text-[11px] leading-[1.3] text-foreground/90",
          overlay && "lg:text-white"
        )}
      >
        <span
          className={cn(
            "mr-1 align-[0.5px] text-[9.5px] font-normal tabular text-muted-foreground/55",
            overlay && "lg:text-white/45"
          )}
        >
          {formatClock(m.timestamp)}
        </span>

        <SourceHover platform={m.platform}>
          <span className="mr-1 inline-block align-[-1.5px]">
            <PlatformGlyph
              platform={m.platform}
              inherit
              className={cn("inline-block h-3 w-3", platformColor)}
            />
          </span>
        </SourceHover>

        {showRole && (
          <span
            className={cn(
              "mr-1 inline-block rounded-[3px] bg-black/[0.06] px-1 py-px align-[2px] text-[8px] font-bold uppercase leading-none tracking-wide",
              role.class,
              overlay && "lg:bg-white/15"
            )}
          >
            {role.label}
          </span>
        )}

        <SourceHover platform={m.platform}>
          <button
            onClick={() => selectUser(m.userId)}
            className={cn("font-bold hover:underline", platformColor)}
          >
            {m.displayName}
          </button>
        </SourceHover>
        <span className={cn("font-bold text-foreground/60", overlay && "lg:text-white/70")}>:</span>{" "}
        <MessageContent text={m.content} />

        {m.flagged && (
          <span className="ml-1.5 align-[1px] text-[10px] font-medium text-destructive">
            <Flag className="mr-0.5 inline h-3 w-3 align-[-2px]" />
            flagged
          </span>
        )}

        {(m.reactions ?? 0) > 0 && (
          <span
            className={cn(
              "ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-black/[0.05] px-1.5 py-px align-[1px] text-[10px] text-muted-foreground",
              overlay && "lg:bg-white/10 lg:text-white/75"
            )}
          >
            <Heart className="h-2.5 w-2.5 text-rose-500" /> {m.reactions}
          </span>
        )}
      </p>

      {/* Inline moderation actions */}
      <div className="absolute right-2 top-1.5 flex items-center gap-0.5 rounded-lg border border-black/10 bg-popover/90 p-0.5 opacity-0 shadow-lg backdrop-blur-md transition-opacity group-hover/msg:opacity-100">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => flagMessage(m.id)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-black/10 hover:text-amber-600"
              >
                <Flag className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Flag</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => hideMessage(m.id)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-black/10 hover:text-foreground"
              >
                <EyeOff className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Hide</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => muteUser(m.username, m.platform)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-black/10 hover:text-destructive"
              >
                <VolumeX className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Mute user</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export const MessageRow = memo(MessageRowBase, (a, b) => a.message.id === b.message.id && a.message.flagged === b.message.flagged);
