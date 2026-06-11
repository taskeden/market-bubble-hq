"use client";

import { useState } from "react";
import { MessagesSquare, Sparkles, Heart, Share2, Bell } from "lucide-react";
import { StreamPlayer } from "@/components/stream/stream-player";
import { Feed } from "@/components/feed/feed";
import { BubblesPanel } from "@/components/bubbles/bubbles-panel";
import { UserAvatar } from "@/components/brand/user-avatar";
import { MY_PFP } from "@/lib/data/nft-pfp";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Widget } from "@/components/widgets/widget";
import { TrendingStocks } from "@/components/widgets/trending-stocks";
import { SentimentBar } from "@/components/widgets/sentiment-bar";
import { useHQ } from "@/store/hq-store";
import { cn, formatNumber } from "@/lib/utils";

const TAGS = ["#FedDay", "#premarket", "#options", "#NVDA", "#macro"];

export default function LivePage() {
  const [tab, setTab] = useState<"chat" | "bubbles">("chat");
  const stats = useHQ((s) => s.stats);

  return (
    <div className="flex h-full flex-col xl:flex-row">
      {/* Main column */}
      <div className="min-w-0 flex-1 space-y-4 overflow-y-auto p-4 lg:p-6">
        <StreamPlayer />

        {/* About the stream */}
        <Card className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <UserAvatar name="Noah" platform="hq" size="lg" online nft nftSrc={MY_PFP} />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">Noah</h2>
                  <span className="rounded-md bg-hq/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-hq">
                    Founder
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Market Bubble · 124K followers</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {TAGS.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-black/[0.08] bg-black/[0.03] px-2 py-0.5 text-[11px] text-foreground/70"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button>
                <Heart className="h-4 w-4" /> Follow
              </Button>
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-foreground/80">
            Live pre-market breakdown ahead of the Fed decision. We&apos;re watching
            $NVDA, $SPY and the rate-cut odds together — drop your levels in chat and
            ask Bubbles for the community read. This is the Market Bubble HQ second
            screen: everyone, every platform, one room. 🫧
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <MiniStat label="Watching now" value={formatNumber(stats.currentViewers)} />
            <MiniStat label="Peak today" value={formatNumber(stats.peakViewers)} />
            <MiniStat label="Active in chat" value={formatNumber(stats.activeMembers)} />
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Widget title="Trending Stocks" icon={<Sparkles className="h-4 w-4" />}>
            <TrendingStocks limit={5} />
          </Widget>
          <Widget title="Community Sentiment">
            <SentimentBar />
          </Widget>
        </div>
      </div>

      {/* Chat sidebar */}
      <aside className="flex h-[55vh] w-full shrink-0 flex-col border-t border-black/[0.06] bg-card/30 backdrop-blur-xl xl:h-auto xl:w-[400px] xl:border-l xl:border-t-0">
        <div className="flex items-center gap-1 border-b border-black/[0.06] p-2">
          <TabButton active={tab === "chat"} onClick={() => setTab("chat")}>
            <MessagesSquare className="h-4 w-4" /> Live Chat
          </TabButton>
          <TabButton active={tab === "bubbles"} onClick={() => setTab("bubbles")}>
            <Sparkles className="h-4 w-4" /> Bubbles
          </TabButton>
        </div>
        <div className="min-h-0 flex-1">
          {tab === "chat" ? (
            <Feed showHeader={false} dense />
          ) : (
            <BubblesPanel />
          )}
        </div>
      </aside>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-black/[0.06] text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] p-3 text-center">
      <div className="tabular text-lg font-bold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
