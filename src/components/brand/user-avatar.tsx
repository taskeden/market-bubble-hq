import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, hashString, initials } from "@/lib/utils";
import type { Platform } from "@/lib/types";
import { NftAvatar } from "./nft-avatar";

const GRADIENTS = [
  "from-rose-500 to-orange-400",
  "from-violet-500 to-fuchsia-400",
  "from-sky-500 to-cyan-400",
  "from-emerald-500 to-lime-400",
  "from-amber-500 to-yellow-400",
  "from-indigo-500 to-blue-400",
  "from-pink-500 to-rose-400",
  "from-teal-500 to-emerald-400",
  "from-purple-500 to-indigo-400",
  "from-cyan-500 to-sky-400",
];

const RING: Record<Platform, string> = {
  twitch: "ring-twitch/60",
  kick: "ring-kick/60",
  x: "ring-x/40",
  youtube: "ring-youtube/60",
  hq: "ring-gold/60",
};

const SIZES = {
  xs: "h-6 w-6 text-[8px]",
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-xs",
  lg: "h-14 w-14 text-sm",
  xl: "h-20 w-20 text-lg",
};

export function UserAvatar({
  name,
  platform,
  size = "md",
  online,
  ring = true,
  /** Render a generative NFT pixel PFP instead of the initials gradient. */
  nft = false,
  /** Path to a real collection PFP image (public/brand/nft/*). Wins over `nft`. */
  nftSrc,
  /** Crisp nearest-neighbor scaling for low-res pixel art (e.g. CryptoPunks). */
  nftPixelated = false,
  className,
}: {
  name: string;
  platform?: Platform;
  size?: keyof typeof SIZES;
  online?: boolean;
  ring?: boolean;
  nft?: boolean;
  nftSrc?: string;
  nftPixelated?: boolean;
  className?: string;
}) {
  const gradient = GRADIENTS[Math.floor(hashString(name) * GRADIENTS.length)];
  return (
    <div className={cn("relative shrink-0", className)}>
      <Avatar
        className={cn(
          SIZES[size],
          ring && platform && "ring-2 ring-offset-2 ring-offset-background",
          ring && platform && RING[platform]
        )}
      >
        {nftSrc ? (
          <>
            <AvatarImage
              src={nftSrc}
              alt=""
              className={cn("object-cover", nftPixelated && "[image-rendering:pixelated]")}
            />
            <AvatarFallback className={cn("bg-gradient-to-br font-bold text-white/95", gradient)}>
              {initials(name)}
            </AvatarFallback>
          </>
        ) : nft ? (
          <NftAvatar seed={name} />
        ) : (
          <AvatarFallback
            className={cn(
              "bg-gradient-to-br font-bold text-white/95",
              gradient
            )}
          >
            {initials(name)}
          </AvatarFallback>
        )}
      </Avatar>
      {online !== undefined && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
            online ? "bg-emerald-400" : "bg-muted-foreground/50"
          )}
        />
      )}
    </div>
  );
}
