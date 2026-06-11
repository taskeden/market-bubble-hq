"use client";

import { Users, Eye, Zap, PieChart, Activity, Flame, Hash } from "lucide-react";
import { useHQ } from "@/store/hq-store";
import { Widget, StatTile } from "@/components/widgets/widget";
import { ActiveMembers } from "@/components/widgets/active-members";
import { PlatformBreakdown } from "@/components/widgets/platform-breakdown";
import { MostActive } from "@/components/widgets/most-active";
import { TrendingTopics } from "@/components/widgets/trending-topics";
import { SentimentBar } from "@/components/widgets/sentiment-bar";
import { AnimatedNumber } from "@/components/widgets/animated-number";

export function RightRailContent() {
  const viewers = useHQ((s) => s.stats.currentViewers);
  const mpm = useHQ((s) => s.stats.messagesPerMinute);

  return (
    <div className="space-y-4">
      <Widget title="Active Community" icon={<Users className="h-4 w-4" />}>
        <ActiveMembers />
      </Widget>

      <div className="grid grid-cols-2 gap-4">
        <StatTile
          label="Viewers"
          value={<AnimatedNumber value={viewers} />}
          icon={<Eye className="h-4 w-4" />}
          sub={<span className="text-emerald-600">● live now</span>}
        />
        <StatTile
          label="Msgs / min"
          value={<AnimatedNumber value={mpm} duration={0.4} />}
          icon={<Zap className="h-4 w-4" />}
          accent="text-bubble"
          sub={<span className="text-muted-foreground">across platforms</span>}
        />
      </div>

      <Widget title="Platform Breakdown" icon={<PieChart className="h-4 w-4" />}>
        <PlatformBreakdown />
      </Widget>

      <Widget title="Community Sentiment" icon={<Activity className="h-4 w-4" />}>
        <SentimentBar />
      </Widget>

      <Widget title="Most Active Members" icon={<Flame className="h-4 w-4" />}>
        <MostActive />
      </Widget>

      <Widget title="Trending Discussions" icon={<Hash className="h-4 w-4" />}>
        <TrendingTopics />
      </Widget>
    </div>
  );
}

export function RightRail() {
  return (
    <aside className="hidden w-[340px] shrink-0 border-l border-black/[0.06] bg-card/25 backdrop-blur-xl xl:block">
      <div className="h-full overflow-y-auto p-4">
        <RightRailContent />
      </div>
    </aside>
  );
}
