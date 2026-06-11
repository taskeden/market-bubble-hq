"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Volume2, Maximize2, Youtube, Clapperboard } from "lucide-react";
import { useHQ } from "@/store/hq-store";
import { PlatformGlyph } from "@/components/brand/platform-icon";
import { BubbleMark } from "@/components/brand/logo";
import { UserAvatar } from "@/components/brand/user-avatar";
import { MY_PFP } from "@/lib/data/nft-pfp";
import { SITE } from "@/lib/config";
import type { FeaturedStream } from "@/app/api/youtube/route";
import { cn, formatNumber } from "@/lib/utils";

type Source = "youtube" | "twitch" | "kick" | "hq";

const TWITCH_CHANNEL = process.env.NEXT_PUBLIC_TWITCH_CHANNEL || SITE.twitch;
const KICK_CHANNEL = process.env.NEXT_PUBLIC_KICK_CHANNEL || SITE.kick;

export function StreamPlayer() {
  const [host, setHost] = useState<string | null>(null);
  const [source, setSource] = useState<Source>("youtube");
  const viewers = useHQ((s) => s.stats.currentViewers);

  const { data: yt } = useQuery<FeaturedStream>({
    queryKey: ["youtube-featured"],
    queryFn: async () => {
      const r = await fetch("/api/youtube");
      if (!r.ok) throw new Error("Failed to load featured stream");
      return r.json();
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  useEffect(() => {
    setHost(window.location.hostname);
  }, []);

  const src =
    source === "youtube"
      ? yt?.videoId
        ? `https://www.youtube.com/embed/${yt.videoId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`
        : null
      : source === "twitch" && host
        ? `https://player.twitch.tv/?channel=${TWITCH_CHANNEL}&parent=${host}&muted=true&autoplay=true`
        : source === "kick"
          ? `https://player.kick.com/${KICK_CHANNEL}`
          : null;

  const isReplay = source === "youtube" && yt?.live === false && !!yt.videoId;
  const title = source === "youtube" && yt?.title ? yt.title : "Pre-Market Breakdown — Fed Day 🫧";
  const popOut =
    source === "twitch"
      ? `https://www.twitch.tv/${TWITCH_CHANNEL}`
      : source === "kick"
        ? `https://kick.com/${KICK_CHANNEL}`
        : yt?.url ?? SITE.youtube.url;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-card/60 shadow-2xl backdrop-blur-xl">
      {/* Chrome header */}
      <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-2.5">
        {isReplay ? (
          <div className="flex items-center gap-1.5 rounded-lg bg-black/[0.06] px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            <Clapperboard className="h-3 w-3" />
            Replay
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-lg bg-destructive/15 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-destructive">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
            </span>
            Live
          </div>
        )}
        <UserAvatar name="Noah" platform="hq" size="sm" online nft nftSrc={MY_PFP} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="text-[11px] text-muted-foreground">Noah · Market Bubble</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-black/[0.06] bg-black/[0.02] px-2 py-1 text-xs">
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="tabular font-semibold">{formatNumber(viewers)}</span>
          <span className="text-muted-foreground">watching</span>
        </div>
      </div>

      {/* Video surface */}
      <div className="relative aspect-video bg-black">
        {src ? (
          <iframe
            key={src}
            src={src}
            title="Market Bubble live stream"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <BrandedScreen viewers={viewers} />
        )}
      </div>

      {/* Chrome footer — source switcher */}
      <div className="flex flex-wrap items-center gap-2 border-t border-black/[0.06] px-3 py-2.5">
        <span className="mr-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Source
        </span>
        <SourceTab id="youtube" label="YouTube" active={source} onSelect={setSource} glyph />
        <SourceTab id="twitch" label="Twitch" active={source} onSelect={setSource} glyph />
        <SourceTab id="kick" label="Kick" active={source} onSelect={setSource} glyph />
        <SourceTab id="hq" label="HQ" active={source} onSelect={setSource} glyph />
        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-md bg-black/[0.05] px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            1080p60
          </span>
          <a
            href={popOut}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Pop out <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

function SourceTab({
  id,
  label,
  active,
  onSelect,
  glyph,
}: {
  id: Source;
  label: string;
  active: Source;
  onSelect: (s: Source) => void;
  glyph?: boolean;
}) {
  const on = active === id;
  return (
    <button
      onClick={() => onSelect(id)}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
        on
          ? "border-hq/30 bg-hq/10 text-hq"
          : "border-black/[0.06] text-muted-foreground hover:text-foreground"
      )}
    >
      {glyph &&
        (id === "hq" ? (
          <BubbleMark className="h-3.5 w-3.5" />
        ) : id === "youtube" ? (
          <Youtube className="h-3.5 w-3.5" />
        ) : (
          <PlatformGlyph platform={id} className="h-3.5 w-3.5" />
        ))}
      {label}
    </button>
  );
}

function BrandedScreen({ viewers }: { viewers: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-ink text-paper">
      <div className="absolute inset-0 bg-gradient-to-br from-hq/25 via-transparent to-bubble/25" />
      <div className="absolute inset-0 animate-gradient-pan bg-[radial-gradient(40%_40%_at_30%_30%,hsl(var(--hq)/0.18),transparent_60%),radial-gradient(40%_40%_at_70%_70%,hsl(var(--bubble)/0.16),transparent_60%)] bg-[length:200%_200%]" />

      {/* Faux audio waveform */}
      <div className="absolute bottom-10 flex items-end gap-1 opacity-40">
        {Array.from({ length: 48 }).map((_, i) => (
          <span
            key={i}
            className="w-1 rounded-full bg-hq"
            style={{
              height: `${8 + Math.abs(Math.sin(i * 0.6)) * 36}px`,
              animation: `float ${1 + (i % 5) * 0.2}s ease-in-out ${i * 0.04}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative">
          <BubbleMark className="h-16 w-16 invert" />
          <div className="absolute inset-0 -z-10 rounded-full bg-hq/40 blur-2xl" />
        </div>
        <h3 className="mt-4 font-display text-2xl font-bold tracking-tight">
          Market Bubble — Live Broadcast
        </h3>
        <p className="mt-1 max-w-md text-sm text-paper/60">
          The HQ broadcast surface. Switch the source to Twitch or Kick to embed
          the live platform player.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="tabular text-sm font-semibold">{formatNumber(viewers)}</span>
          <span className="text-sm text-paper/60">watching now</span>
        </div>
      </div>

      <button className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur transition-colors hover:bg-white/20">
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}
