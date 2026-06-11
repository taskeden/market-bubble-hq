"use client";

import { Hash, Mic, Volume2 } from "lucide-react";
import { useHQ } from "@/store/hq-store";
import { UserAvatar } from "@/components/brand/user-avatar";
import { MY_PFP } from "@/lib/data/nft-pfp";
import { cn, formatNumber } from "@/lib/utils";
import { CHANNELS, VOICE_MEMBERS, isMutedInVoice, type LoungeChannel } from "./lounge-channels";

// ─── The hangout's server rail — branded cardstock (theme-aware) ──────────────
// A real Discord channel list: TEXT CHANNELS (general / memes / stocks / crypto
// / nfts) + a VOICE CHANNEL with people sitting in it. No platform filters, no
// "on air" — just channels you hop between.

function ChannelRow({
  channel,
  active,
  onSelect,
}: {
  channel: LoungeChannel;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group flex w-full items-center gap-2 rounded-md px-2 py-[7px] text-left text-[13px] transition-colors",
        active
          ? "bg-black/[0.06] font-semibold text-foreground"
          : "text-muted-foreground hover:bg-black/[0.035] hover:text-foreground/90"
      )}
    >
      {channel.kind === "voice" ? (
        <Volume2 className={cn("h-4 w-4 shrink-0", active ? "text-hq" : "text-muted-foreground/70")} />
      ) : (
        <Hash className={cn("h-4 w-4 shrink-0", active ? "text-hq" : "text-muted-foreground/60")} />
      )}
      <span className="truncate">{channel.name}</span>
    </button>
  );
}

export function ChannelRail({
  channel,
  onSelect,
  onFloor,
}: {
  channel: string;
  onSelect: (id: string) => void;
  onFloor: number;
}) {
  const isLoggedIn = useHQ((s) => s.isLoggedIn);
  const user = useHQ((s) => s.currentUser);
  const points = useHQ((s) => s.points);
  const openLogin = useHQ((s) => s.openLogin);
  const selectUser = useHQ((s) => s.selectUser);

  const textChannels = CHANNELS.filter((c) => c.kind === "text");
  const voiceChannels = CHANNELS.filter((c) => c.kind === "voice");

  return (
    <aside className="cardstock hidden w-[236px] shrink-0 flex-col border-r border-black/[0.07] lg:flex">
      {/* ── Header ── */}
      <div className="border-b border-black/[0.06] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-hq/12 text-hq">
            <Hash className="h-3 w-3" />
          </span>
          <span className="font-display text-[14px] font-bold tracking-tight text-foreground">
            The Floor
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="tabular font-medium text-foreground/80">{formatNumber(onFloor)}</span>
          on the floor
        </div>
      </div>

      {/* ── Channels ── */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2.5 py-3">
        <div>
          <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
            Text channels
          </p>
          <div className="space-y-0.5">
            {textChannels.map((c) => (
              <ChannelRow
                key={c.id}
                channel={c}
                active={c.id === channel}
                onSelect={() => onSelect(c.id)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
            Voice channels
          </p>
          {voiceChannels.map((c) => (
            <div key={c.id}>
              <ChannelRow channel={c} active={c.id === channel} onSelect={() => onSelect(c.id)} />
              {/* People sitting in voice (Discord nests them under the channel) */}
              <div className="mb-1 ml-3.5 mt-0.5 space-y-0.5 border-l border-black/[0.07] pl-3">
                {VOICE_MEMBERS.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => selectUser(m.id)}
                    className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left transition-colors hover:bg-black/[0.035]"
                  >
                    <UserAvatar name={m.displayName} size="xs" nft ring={false} />
                    <span className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">
                      {m.displayName}
                    </span>
                    {isMutedInVoice(i) ? (
                      <Mic className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                    ) : (
                      <span className="flex h-3 shrink-0 items-end gap-px" aria-label="speaking">
                        {[0, 1, 2].map((b) => (
                          <span
                            key={b}
                            className="w-0.5 rounded-full bg-emerald-500"
                            style={{
                              height: `${4 + b * 2}px`,
                              animation: `float ${0.6 + b * 0.15}s ease-in-out ${i * 0.1}s infinite`,
                            }}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── User bar ── */}
      <div className="border-t border-black/[0.06] p-2">
        {isLoggedIn ? (
          <button
            onClick={() => selectUser(user.id)}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-black/[0.04]"
          >
            <UserAvatar name={user.displayName} size="sm" nft nftSrc={MY_PFP} ring={false} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold leading-tight text-foreground">
                {user.displayName}
              </p>
              <p className="tabular text-[10px] font-medium text-gold">{formatNumber(points)} pts</p>
            </div>
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
          </button>
        ) : (
          <button
            onClick={openLogin}
            className="w-full rounded-md bg-gradient-to-r from-hq to-hq/85 px-3 py-2 text-[12.5px] font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            Join HQ — claim your seat
          </button>
        )}
      </div>
    </aside>
  );
}
