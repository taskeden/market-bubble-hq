import { BADGES } from "@/lib/config";
import type { BadgeId } from "@/lib/types";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function BadgeChip({
  id,
  size = "md",
  showLabel = true,
}: {
  id: BadgeId;
  size?: "sm" | "md";
  showLabel?: boolean;
}) {
  const badge = BADGES[id];
  if (!badge) return null;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br font-semibold text-black/85 shadow-sm",
              badge.gradient,
              size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]"
            )}
          >
            <Icon
              name={badge.icon}
              className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"}
            />
            {showLabel && badge.label}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px]">
          <p className="font-semibold">{badge.label}</p>
          <p className="text-muted-foreground">{badge.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
