"use client";

import { useMemo, useState } from "react";
import { ChannelRail } from "./channel-rail";
import { LoungeFeed } from "./lounge-feed";
import { MemberRail } from "./member-rail";
import { VoiceStage } from "./voice-stage";
import { useLoungeFeed } from "./use-lounge-feed";
import { channelById, DEFAULT_CHANNEL } from "./lounge-channels";

// ─── The Lounge — the Community page as a premium Discord hangout ─────────────
// Fully on the site's own branding (cardstock, gold/red accents, paper grain),
// so it reads on the light desk AND flips with the dark-mode toggle. A real
// channel list — general / memes / stocks / crypto / nfts + a voice room — each
// text channel filled with its own lively bot crowd (independent of the live
// hero chat). Member list + Bubbles on the right.

export function Lounge() {
  const [channelId, setChannelId] = useState(DEFAULT_CHANNEL);
  const [query, setQuery] = useState("");
  const [showMembers, setShowMembers] = useState(true);

  const channel = channelById(channelId);
  const { messages, floor, hide, onFloor } = useLoungeFeed(channelId);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(
      (m) => m.content.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q)
    );
  }, [messages, query]);

  return (
    <div className="h-full p-3 lg:p-4">
      <div className="flex h-full overflow-hidden rounded-xl border border-black/[0.08] bg-card shadow-[0_1px_0_0_hsl(0_0%_100%/0.5)_inset,0_18px_44px_-26px_hsl(260_20%_20%/0.55)]">
        <ChannelRail channel={channelId} onSelect={setChannelId} onFloor={onFloor} />

        {channel.kind === "voice" ? (
          <VoiceStage channel={channel} />
        ) : (
          <LoungeFeed
            channel={channel}
            messages={visible}
            onHide={hide}
            query={query}
            onQuery={setQuery}
            showMembers={showMembers}
            onToggleMembers={() => setShowMembers((v) => !v)}
          />
        )}

        {showMembers && <MemberRail messages={floor} />}
      </div>
    </div>
  );
}
