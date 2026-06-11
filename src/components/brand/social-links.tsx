import { Youtube } from "lucide-react";
import { PlatformGlyph } from "./platform-icon";
import { SOCIALS } from "@/lib/config";
import { cn } from "@/lib/utils";

/** Official Market Bubble follow links (YouTube · Twitch · Kick · X). */
export function SocialLinks({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {SOCIALS.map((s) => (
        <a
          key={s.id}
          href={s.url}
          target="_blank"
          rel="noreferrer"
          title={`${s.label} · ${s.handle}`}
          aria-label={`${s.label} (${s.handle})`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.07] bg-black/[0.02] text-muted-foreground transition-colors hover:border-black/15 hover:bg-black/[0.05] hover:text-foreground"
        >
          {s.id === "youtube" ? (
            <Youtube className="h-4 w-4" />
          ) : (
            <PlatformGlyph platform={s.id} className="h-4 w-4" />
          )}
        </a>
      ))}
    </div>
  );
}
