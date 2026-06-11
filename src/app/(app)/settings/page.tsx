"use client";

import { useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Plug,
  Database,
  Sparkles,
  Check,
  Filter,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/brand/user-avatar";
import { MY_PFP } from "@/lib/data/nft-pfp";
import { PlatformIcon } from "@/components/brand/platform-icon";
import { useHQ } from "@/store/hq-store";
import { cn } from "@/lib/utils";
import { PLATFORM_ORDER, PLATFORMS } from "@/lib/config";
import { setDemoMode, useDemoMode } from "@/lib/demo";
import type { ReactNode } from "react";
import type { Platform } from "@/lib/types";

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.08] bg-black/[0.03] text-hq">
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

function Row({
  label,
  hint,
  control,
}: {
  label: string;
  hint?: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-black/[0.05] py-3 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export default function SettingsPage() {
  const currentUser = useHQ((s) => s.currentUser);
  const setDisplayName = useHQ((s) => s.setDisplayName);
  const filterPlatforms = useHQ((s) => s.filterPlatforms);
  const togglePlatform = useHQ((s) => s.togglePlatform);
  const spamFilter = useHQ((s) => s.spamFilter);
  const toggleSpamFilter = useHQ((s) => s.toggleSpamFilter);

  const demo = useDemoMode();
  const [name, setName] = useState(currentUser.displayName);
  const [saved, setSaved] = useState(false);
  const [connections, setConnections] = useState<Record<Platform, boolean>>({
    twitch: true,
    kick: false,
    x: false,
    youtube: true,
    hq: true,
  });
  const [notif, setNotif] = useState({
    mentions: true,
    bubbles: true,
    mvp: true,
    polls: false,
  });

  const save = () => {
    setDisplayName(name.trim() || "You");
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Settings"
        description="Make Market Bubble HQ yours."
        icon={<SettingsIcon className="h-5 w-5" />}
      />

      {/* Profile */}
      <Section title="Profile" description="How you appear across the HQ" icon={<User className="h-4 w-4" />}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex flex-col items-center gap-2">
            <UserAvatar name={name || "You"} platform="hq" size="xl" online nft nftSrc={MY_PFP} />
            <span className="text-[11px] text-muted-foreground">HQ identity</span>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Display name
              </label>
              <div className="flex gap-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                <Button onClick={save} className="shrink-0">
                  {saved ? (
                    <>
                      <Check className="h-4 w-4" /> Saved
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Messages you post appear in the unified feed tagged{" "}
              <span className="font-semibold text-hq">HQ</span>, alongside Twitch, Kick and X.
            </p>
          </div>
        </div>
      </Section>

      {/* Connections */}
      <Section
        title="Connected Platforms"
        description="Link your accounts to unify your identity"
        icon={<Plug className="h-4 w-4" />}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {PLATFORM_ORDER.map((p) => (
            <div
              key={p}
              className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-black/[0.02] p-3"
            >
              <PlatformIcon platform={p} size="md" />
              <div className="flex-1">
                <p className="text-sm font-medium">{PLATFORMS[p].label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {connections[p] ? "Connected" : "Not connected"}
                </p>
              </div>
              <Button
                size="sm"
                variant={connections[p] ? "secondary" : "outline"}
                onClick={() => setConnections((c) => ({ ...c, [p]: !c[p] }))}
              >
                {connections[p] ? "Disconnect" : "Connect"}
              </Button>
            </div>
          ))}
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={<Bell className="h-4 w-4" />}>
        <Row
          label="Mentions"
          hint="When someone @mentions you in the feed"
          control={
            <Switch
              checked={notif.mentions}
              onCheckedChange={(v) => setNotif((n) => ({ ...n, mentions: v }))}
            />
          }
        />
        <Row
          label="Bubbles insights"
          hint="Summaries, sentiment shifts and highlights"
          control={
            <Switch
              checked={notif.bubbles}
              onCheckedChange={(v) => setNotif((n) => ({ ...n, bubbles: v }))}
            />
          }
        />
        <Row
          label="Weekly MVP"
          hint="When MVP and leaderboard winners are announced"
          control={
            <Switch checked={notif.mvp} onCheckedChange={(v) => setNotif((n) => ({ ...n, mvp: v }))} />
          }
        />
        <Row
          label="New polls"
          hint="When Bubbles opens a community poll"
          control={
            <Switch
              checked={notif.polls}
              onCheckedChange={(v) => setNotif((n) => ({ ...n, polls: v }))}
            />
          }
        />
      </Section>

      {/* Feed preferences */}
      <Section title="Feed Preferences" icon={<Filter className="h-4 w-4" />}>
        <Row
          label="Auto spam filter"
          hint="Automatically hide links and spammy messages"
          control={<Switch checked={spamFilter} onCheckedChange={toggleSpamFilter} />}
        />
        <div className="border-t border-black/[0.05] py-3">
          <p className="mb-2 text-sm font-medium">Default platforms in feed</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_ORDER.map((p) => (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition-colors ${
                  filterPlatforms[p]
                    ? "border-hq/30 bg-hq/10 text-foreground"
                    : "border-black/[0.06] text-muted-foreground"
                }`}
              >
                <PlatformIcon platform={p} size="sm" />
                {PLATFORMS[p].label}
                {filterPlatforms[p] && <Check className="h-3.5 w-3.5 text-hq" />}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Data mode / demo */}
      <Section
        title="Data Source"
        description="Where the live feed comes from"
        icon={<Database className="h-4 w-4" />}
      >
        <div
          className={cn(
            "rounded-xl border p-4 transition-colors",
            demo ? "border-gold/40 bg-gold/[0.06]" : "border-black/[0.06] bg-black/[0.02]"
          )}
        >
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", demo ? "bg-gold" : "bg-emerald-400")} />
            <span className="text-sm font-semibold">
              {demo ? "Demo mode — simulated crowd" : "Live — the hosts' real rooms"}
            </span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            {demo
              ? "The feed is running the built-in simulation: bots across Twitch, Kick, X and YouTube plus host tweets, so the whole HQ is lively for a walkthrough or recording. Turn this off to return to the hosts' real chat."
              : "Connected to the hosts' actual rooms (Twitch / Kick / YouTube live, X with a token). The feed stays still unless someone really chats. Flip on demo mode to fill it with a simulated crowd for a proof-of-concept recording."}
          </p>
        </div>
        <Row
          label="Demo mode"
          hint="Lively simulated chat for demos & Loom recordings — also reachable at ?demo=1"
          control={<Switch checked={demo} onCheckedChange={setDemoMode} />}
        />
      </Section>

      {/* Bubbles */}
      <Section
        title="Bubbles Co-Host"
        description="Your AI community member"
        icon={<Sparkles className="h-4 w-4" />}
      >
        <Row label="Welcome new members" hint="Bubbles greets newcomers in the feed" control={<Switch defaultChecked />} />
        <Row label="Auto summaries" hint="Periodic recaps of the conversation" control={<Switch defaultChecked />} />
        <Row label="Generate polls" hint="Bubbles opens polls during big moments" control={<Switch defaultChecked />} />
        <Row label="Sentiment analysis" hint="Continuous read of community mood" control={<Switch defaultChecked />} />
      </Section>

      <p className="pb-4 text-center text-[11px] text-muted-foreground">
        Market Bubble HQ · built for the community 🫧
      </p>
    </div>
  );
}
