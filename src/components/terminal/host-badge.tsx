import { HOSTS } from "@/lib/config";
import type { HostId } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Color-coded host name identifying WHOSE room a message came from — no plate,
 * no dot, just the name in the host's tag color: Ansem green, Banks white,
 * Market Bubble gold. Market Bubble shortens to "MB" so it doesn't run long.
 *
 * `em` renders the size in em units so the broadcast stage's viewport-scaled
 * font-size drives it too.
 */
/**
 * Host color, in both a `text-` and `bg-` flavor, so the message tag and the
 * Source Matrix section dots stay in sync from one place: Ansem green, Banks
 * white, Market Bubble gold.
 */
export const HOST_TAG: Record<HostId, { text: string; dot: string }> = {
  ansem: { text: "text-emerald-400", dot: "bg-emerald-400" },
  banks: { text: "text-foreground", dot: "bg-foreground" },
  marketbubble: { text: "text-gold", dot: "bg-gold" },
};

export function HostBadge({
  host,
  em = false,
  className,
}: {
  host: HostId;
  em?: boolean;
  className?: string;
}) {
  const meta = HOSTS[host];
  const label = host === "marketbubble" ? "MB" : meta.label;
  return (
    <span
      title={`${meta.label}'s room`}
      className={cn(
        "shrink-0 whitespace-nowrap font-bold uppercase",
        HOST_TAG[host].text,
        em ? "text-[0.5em] tracking-[0.16em]" : "text-[8.5px] tracking-[0.14em]",
        className
      )}
    >
      {label}
    </span>
  );
}
