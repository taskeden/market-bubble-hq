"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ZONES = [
  { city: "New York", tz: "America/New_York", code: "ET" },
  { city: "Los Angeles", tz: "America/Los_Angeles", code: "PT" },
  { city: "London", tz: "Europe/London", code: "GMT" },
];

function timeIn(tz: string, now: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(now);
}

export function WorldClocks({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  return (
    <div className={cn("flex items-stretch", className)}>
      {ZONES.map((z, i) => (
        <div key={z.code} className="flex items-center">
          {i > 0 && <span className="mx-4 h-7 w-px bg-black/10" />}
          <div className="leading-tight">
            <div className="text-[8.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {z.city}
            </div>
            <div className="tabular text-[12px] font-semibold text-foreground">
              {timeIn(z.tz, now)}{" "}
              <span className="text-[9px] font-medium text-muted-foreground">{z.code}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
