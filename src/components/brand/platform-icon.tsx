import { cn } from "@/lib/utils";
import type { Platform } from "@/lib/types";
import { PLATFORMS } from "@/lib/config";

// Custom inline brand glyphs so we never depend on icon-pack brand availability.
// Each renders monochrome (currentColor) and is tinted by the platform color.

function TwitchGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4 3 3 6.5V19h4v2.5h2.5L12 19h3.5L21 13.5V3H4Zm15 9.5L16.5 15H13l-2.2 2.2V15H7.5V5H19v7.5Z" />
      <path d="M16.5 7.5H15v4h1.5v-4ZM12.5 7.5H11v4h1.5v-4Z" />
    </svg>
  );
}

function KickGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4 3h5v5h2V5h2V3h6v6h-2v2h-2v2h2v2h2v6h-6v-2h-2v-3H9v5H4V3Z" />
    </svg>
  );
}

function XGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function YouTubeGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.28 5 12 5 12 5s-6.28 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26.2 26.2 0 0 0 2 12c0 1.62.13 3.23.4 4.8a2.5 2.5 0 0 0 1.76 1.77C5.72 19 12 19 12 19s6.28 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77c.27-1.57.4-3.18.4-4.8 0-1.62-.13-3.23-.4-4.8ZM10 15.2V8.8L15.6 12 10 15.2Z" />
    </svg>
  );
}

function HQGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="9" cy="10" r="5.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16.5" cy="15" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="7.4" cy="8.2" r="1.3" fill="currentColor" />
    </svg>
  );
}

const GLYPHS: Record<Platform, (p: React.SVGProps<SVGSVGElement>) => JSX.Element> = {
  twitch: TwitchGlyph,
  kick: KickGlyph,
  x: XGlyph,
  youtube: YouTubeGlyph,
  hq: HQGlyph,
};

const COLOR: Record<Platform, string> = {
  twitch: "text-twitch",
  kick: "text-kick",
  x: "text-x",
  youtube: "text-youtube",
  hq: "text-gold",
};

const CHIP: Record<Platform, string> = {
  twitch: "bg-twitch/15 ring-twitch/25",
  kick: "bg-kick/15 ring-kick/25",
  x: "bg-x/10 ring-x/20",
  youtube: "bg-youtube/15 ring-youtube/25",
  hq: "bg-gold/15 ring-gold/25",
};

export function PlatformGlyph({
  platform,
  className,
  inherit,
}: {
  platform: Platform;
  className?: string;
  /** Skip the built-in platform tint and inherit currentColor from the parent. */
  inherit?: boolean;
}) {
  const Glyph = GLYPHS[platform];
  return <Glyph className={cn(!inherit && COLOR[platform], className)} />;
}

/**
 * Poster-style source label: a dark, glowing chip with a colored border +
 * `[glyph] Label`, tinted per platform (Kick green, Twitch purple, X white,
 * HQ gold). Mirrors the Vibe Code Challenge mockup's row chips.
 *
 * `em` renders every dimension in em units so a parent's font-size (e.g. the
 * broadcast stage's viewport-scaled type) drives the chip — used by the
 * on-stream chat rows that must scale with the capture, not fixed px.
 */
export function PlatformChip({
  platform,
  dense,
  em = false,
  className,
}: {
  platform: Platform;
  dense?: boolean;
  em?: boolean;
  className?: string;
}) {
  const meta = PLATFORMS[platform];
  const isX = platform === "x";
  return (
    <span
      className={cn(
        "inline-flex items-center border bg-black/85 font-semibold leading-none",
        em
          ? "gap-[0.38em] rounded-[0.4em] px-[0.55em] py-[0.34em] text-[0.62em]"
          : dense
            ? "gap-1 rounded-md px-1.5 py-0.5 text-[9.5px]"
            : "gap-1.5 rounded-md px-2 py-1 text-[11px]",
        // X reads white on the dark chip, like the poster; everyone else keeps their hue.
        isX ? "text-white" : meta.text,
        className
      )}
      style={
        isX
          ? {
              borderColor: "rgb(255 255 255 / 0.3)",
              boxShadow: "0 0 10px -4px rgb(255 255 255 / 0.4)",
            }
          : {
              borderColor: `hsl(${meta.hsl} / 0.6)`,
              boxShadow: `0 0 10px -3px hsl(${meta.hsl} / 0.5)`,
            }
      }
    >
      <PlatformGlyph
        platform={platform}
        inherit
        className={em ? "h-[1em] w-[1em]" : dense ? "h-2.5 w-2.5" : "h-3 w-3"}
      />
      {meta.label}
    </span>
  );
}

export function PlatformIcon({
  platform,
  size = "md",
  className,
}: {
  platform: Platform;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-9 w-9" : "h-7 w-7";
  const inner = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg ring-1",
        dims,
        CHIP[platform],
        className
      )}
    >
      <PlatformGlyph platform={platform} className={inner} />
    </span>
  );
}
