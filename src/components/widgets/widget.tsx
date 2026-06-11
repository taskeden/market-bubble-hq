import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { ReactNode } from "react";

export function Widget({
  title,
  icon,
  action,
  children,
  className,
  bodyClassName,
  titleClassName,
}: {
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Override the title's font class. Defaults to the marker hand (`font-hand`). */
  titleClassName?: string;
}) {
  return (
    <Card className={cn("lift overflow-hidden", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-black/[0.05] px-4 pb-3.5 pt-2.5">
          <div className="flex items-center gap-2">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            <h3
              className={cn(
                "relative text-[22px] font-bold leading-none",
                titleClassName ?? "font-hand text-hq"
              )}
            >
              {title}
              {/* Hand-drawn marker underline — always brand red (its own
                  `text-hq` color drives `currentColor`, so it stays red even
                  when the title text is overridden to black). */}
              <svg
                aria-hidden
                viewBox="0 0 240 12"
                preserveAspectRatio="none"
                className="absolute -bottom-2 left-0 h-[9px] w-full overflow-visible text-hq"
              >
                <path
                  d="M4 10 Q 120 3.5 236 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </h3>
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </Card>
  );
}

export function StatTile({
  label,
  value,
  sub,
  icon,
  accent = "text-hq",
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <Card className={cn("lift relative overflow-hidden p-4", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <div className="mt-1.5 text-2xl font-bold tracking-tight">{value}</div>
          {sub && <div className="mt-1 text-[11px]">{sub}</div>}
        </div>
        {icon && (
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl bg-black/[0.04]",
              accent
            )}
          >
            {icon}
          </span>
        )}
      </div>
    </Card>
  );
}
