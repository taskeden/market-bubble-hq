import { HOSTS } from "@/lib/config";
import type { HostId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BubbleMark } from "./logo";

/**
 * A host's profile avatar for their tweet cards. Market Bubble wears the brand
 * mark on an ink plate; Ansem / Banks get an accent monogram. Sizing comes from
 * `className` (px or em), so the same avatar scales from the small chat up to
 * the broadcast stage. Uses theme-flipping tokens so it reads on the light
 * community feed AND the dark chat surfaces.
 */
export function HostAvatar({
  host,
  className,
  markClassName,
}: {
  host: HostId;
  className?: string;
  markClassName?: string;
}) {
  const meta = HOSTS[host];
  if (host === "marketbubble") {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-ink ring-1 ring-black/10",
          className
        )}
      >
        <BubbleMark className={cn("invert", markClassName)} />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-black/[0.06] font-bold ring-1 ring-black/10",
        meta.accent,
        className
      )}
    >
      {meta.label[0]}
    </span>
  );
}
