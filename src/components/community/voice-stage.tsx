"use client";

import { useEffect, useState } from "react";
import { Headphones, Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
import { useHQ } from "@/store/hq-store";
import { UserAvatar } from "@/components/brand/user-avatar";
import { MY_PFP } from "@/lib/data/nft-pfp";
import { cn } from "@/lib/utils";
import { VOICE_MEMBERS, isMutedInVoice, type LoungeChannel } from "./lounge-channels";

// ─── Voice channel stage ──────────────────────────────────────────────────────
// What you see when you open #voice-chat — a Discord voice room: participant
// tiles with speaking rings, mic state, and a control dock. Fully branded.

function VoiceTile({
  name,
  nftSrc,
  muted,
  speaking,
  you,
}: {
  name: string;
  nftSrc?: string;
  muted: boolean;
  speaking: boolean;
  you?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex aspect-[4/3] flex-col items-center justify-center gap-2.5 rounded-xl border bg-card/60 p-3 transition-all",
        speaking && !muted ? "border-emerald-500/60 shadow-[0_0_0_2px_hsl(152_60%_45%/0.35)]" : "border-black/[0.07]"
      )}
    >
      <div className="relative">
        <span
          className={cn(
            "block rounded-full ring-2 transition-all",
            speaking && !muted ? "ring-emerald-500" : "ring-transparent"
          )}
        >
          <UserAvatar name={name} size="lg" nft nftSrc={nftSrc} ring={false} />
        </span>
        {muted && (
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-destructive text-primary-foreground">
            <MicOff className="h-3 w-3" />
          </span>
        )}
      </div>
      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground">
        {name}
        {you && <span className="rounded bg-gold/15 px-1 text-[9px] font-bold uppercase text-gold">you</span>}
      </span>
    </div>
  );
}

export function VoiceStage({ channel }: { channel: LoungeChannel }) {
  const isLoggedIn = useHQ((s) => s.isLoggedIn);
  const openLogin = useHQ((s) => s.openLogin);
  const user = useHQ((s) => s.currentUser);

  const [joined, setJoined] = useState(false);
  const [selfMuted, setSelfMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  // A drifting "who's talking" set so the rings feel alive.
  const [speaking, setSpeaking] = useState<Set<number>>(new Set([0, 3]));

  useEffect(() => {
    const id = setInterval(() => {
      const next = new Set<number>();
      VOICE_MEMBERS.forEach((_, i) => {
        if (!isMutedInVoice(i) && Math.random() > 0.6) next.add(i);
      });
      setSpeaking(next);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  const inRoom = VOICE_MEMBERS.length + (joined ? 1 : 0);

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-card/30">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-black/[0.06] bg-card/50 px-4 py-2.5 backdrop-blur-sm">
        <Volume2 className="h-4 w-4 text-hq" />
        <h1 className="font-display text-[16px] font-bold leading-none text-foreground">
          {channel.name}
        </h1>
        <div className="hidden h-4 w-px bg-black/10 md:block" />
        <p className="hidden truncate text-[12px] text-muted-foreground md:block">{channel.topic}</p>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {inRoom} in voice
        </span>
      </div>

      {/* Stage */}
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="mx-auto max-w-[760px]">
          <div className="mb-5 flex items-center gap-2 text-muted-foreground">
            <Headphones className="h-4 w-4" />
            <p className="text-[12.5px]">
              Live voice room — markets banter with the crew. Hop in and talk.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {VOICE_MEMBERS.map((m, i) => (
              <VoiceTile
                key={m.id}
                name={m.displayName}
                muted={isMutedInVoice(i)}
                speaking={speaking.has(i)}
              />
            ))}
            {joined && (
              <VoiceTile name={user.displayName} nftSrc={MY_PFP} muted={selfMuted} speaking={!selfMuted} you />
            )}
          </div>
        </div>
      </div>

      {/* Control dock */}
      <div className="border-t border-black/[0.06] bg-card/50 px-4 py-3 backdrop-blur-sm">
        {joined ? (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setSelfMuted((m) => !m)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
                selfMuted
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-black/[0.08] bg-black/[0.03] text-foreground hover:bg-black/[0.06]"
              )}
              title={selfMuted ? "Unmute" : "Mute"}
            >
              {selfMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setDeafened((d) => !d)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
                deafened
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-black/[0.08] bg-black/[0.03] text-foreground hover:bg-black/[0.06]"
              )}
              title={deafened ? "Undeafen" : "Deafen"}
            >
              <Headphones className="h-4 w-4" />
            </button>
            <button
              onClick={() => setJoined(false)}
              className="flex items-center gap-2 rounded-full bg-destructive px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <PhoneOff className="h-4 w-4" /> Leave
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <button
              onClick={() => (isLoggedIn ? setJoined(true) : openLogin())}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <Mic className="h-4 w-4" /> Join voice
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
