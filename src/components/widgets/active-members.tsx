"use client";

import { useMemo } from "react";
import { useHQ } from "@/store/hq-store";
import { getRoster } from "@/lib/data/roster";
import { UserAvatar } from "@/components/brand/user-avatar";
import { AnimatedNumber } from "./animated-number";

export function ActiveMembers({ max = 7 }: { max?: number }) {
  const activeMembers = useHQ((s) => s.stats.activeMembers);
  const selectUser = useHQ((s) => s.selectUser);

  const online = useMemo(
    () =>
      getRoster()
        .filter((u) => u.online)
        .slice(0, max),
    [max]
  );

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex -space-x-2.5">
        {online.map((u) => (
          <button
            key={u.id}
            onClick={() => selectUser(u.id)}
            className="transition-transform hover:z-10 hover:-translate-y-0.5"
            title={u.displayName}
          >
            <UserAvatar
              name={u.displayName}
              platform={u.primaryPlatform}
              size="sm"
              ring={false}
              className="rounded-full ring-2 ring-background"
            />
          </button>
        ))}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.06] text-[10px] font-semibold text-muted-foreground ring-2 ring-background">
          +{Math.max(0, activeMembers - online.length)}
        </div>
      </div>
      <div className="text-right">
        <AnimatedNumber
          value={activeMembers}
          className="text-lg font-bold text-foreground"
        />
        <p className="text-[11px] text-muted-foreground">active now</p>
      </div>
    </div>
  );
}
