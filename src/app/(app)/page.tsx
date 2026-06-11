"use client";

import {
  MessageSquare,
  Users,
  Eye,
  Zap,
  TrendingUp,
  Rocket,
  Trophy,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useHQ } from "@/store/hq-store";
import { StatTile, Widget } from "@/components/widgets/widget";
import { AnimatedNumber } from "@/components/widgets/animated-number";
import { TrendingStocks } from "@/components/widgets/trending-stocks";
import { RadarWatchlist } from "@/components/widgets/radar-watchlist";
import { Leaderboard } from "@/components/community/leaderboard";
import { PredictionChips } from "@/components/broadcast/prediction-chips";
import { CinematicHero } from "@/components/stream/cinematic-hero";
import { SocialLinks } from "@/components/brand/social-links";
import { formatCompact } from "@/lib/utils";

export default function HomePage() {
  const stats = useHQ((s) => s.stats);

  return (
    <div className="space-y-3 px-4 pb-4 pt-3 lg:px-6 lg:pb-6">
      {/* The main event — Twitch-style stage: player + detached chat column */}
      <CinematicHero />

      {/* Live prediction odds crawl (L→R) */}
      <PredictionChips />

      {/* Community pulse tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="On-Air Viewers"
          value={<AnimatedNumber value={stats.currentViewers} />}
          icon={<Eye className="h-4 w-4" />}
          accent="text-hq"
          sub={<span className="text-muted-foreground">peak {stats.peakViewers.toLocaleString()}</span>}
        />
        <StatTile
          label="Active Members"
          value={<AnimatedNumber value={stats.activeMembers} />}
          icon={<Users className="h-4 w-4" />}
          accent="text-emerald-600"
          sub={<span className="text-muted-foreground">across 4 platforms</span>}
        />
        <StatTile
          label="Community Messages"
          value={<AnimatedNumber value={stats.totalMessages} format={formatCompact} />}
          icon={<MessageSquare className="h-4 w-4" />}
          sub={<span className="text-emerald-600">↑ live counting</span>}
        />
        <StatTile
          label="Messages / min"
          value={<AnimatedNumber value={stats.messagesPerMinute} duration={0.4} />}
          icon={<Zap className="h-4 w-4" />}
          accent="text-bubble"
          sub={<span className="text-muted-foreground">real-time velocity</span>}
        />
      </div>

      {/* Market intelligence */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Widget
          title="Our Radar"
          titleClassName="font-display tracking-tight text-foreground"
          icon={<Rocket className="h-4 w-4" />}
          className="flex flex-col"
          bodyClassName="min-h-0 flex-1 p-4"
        >
          <RadarWatchlist />
        </Widget>
        <Widget
          title="Top Contributors"
          titleClassName="font-display tracking-tight text-foreground"
          icon={<Trophy className="h-4 w-4" />}
          action={
            <Link
              href="/leaders"
              className="flex items-center gap-1 text-[11px] font-medium text-hq hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <Leaderboard limit={5} showBadges={false} />
        </Widget>
        <Widget
          title="Trending Stocks"
          titleClassName="font-display tracking-tight text-foreground"
          icon={<TrendingUp className="h-4 w-4" />}
          action={<span className="text-[11px] text-muted-foreground">community mentions</span>}
        >
          <TrendingStocks limit={6} />
        </Widget>
      </div>

      {/* Broadcast footer — socials + sponsor + compliance, like the stream.
          `data-bubbles-floor`: its top border is the last divider; the Bubbles
          dock sticks to this line so she crests it and stays out of the footer. */}
      <div
        data-bubbles-floor
        className="relative flex flex-col items-center gap-3 border-t border-black/10 pt-5 text-center"
      >
        {/* Imprinted motto — anchored to the footer's bottom-left (lg+) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/motto-light.png"
          alt="Make Money. Command Attention. Leverage AI."
          draggable={false}
          className="pointer-events-none absolute left-0 top-1/2 mt-[16px] hidden w-[190px] -translate-y-1/2 select-none object-contain opacity-90 lg:block lg:dark:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/motto-dark.png"
          alt="Make Money. Command Attention. Leverage AI."
          draggable={false}
          className="pointer-events-none absolute left-0 top-1/2 mt-[16px] hidden w-[190px] -translate-y-1/2 select-none object-contain opacity-90 lg:dark:block"
        />
        {/* Imprinted "Invest in Yourself" — same banner lockup, anchored bottom-right */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/motto-invest-light.png"
          alt="Invest in Yourself."
          draggable={false}
          className="pointer-events-none absolute right-0 top-1/2 mt-[14px] hidden w-[166px] -translate-y-1/2 select-none object-contain opacity-90 lg:block lg:dark:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/motto-invest-dark.png"
          alt="Invest in Yourself."
          draggable={false}
          className="pointer-events-none absolute right-0 top-1/2 mt-[14px] hidden w-[166px] -translate-y-1/2 select-none object-contain opacity-90 lg:dark:block"
        />
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Follow Market Bubble
          </span>
          <SocialLinks />
        </div>
        <div className="mt-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Presented by
          <span className="font-display text-[14px] font-bold normal-case tracking-tight text-foreground">
            Polymarket
          </span>
        </div>
      </div>
    </div>
  );
}
