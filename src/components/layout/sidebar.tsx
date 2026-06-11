"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, ChevronLeft, ChevronRight } from "lucide-react";
import { NAV, NAV_SECONDARY, levelTitle } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icon";
import { Logo } from "@/components/brand/logo";
import { SocialLinks } from "@/components/brand/social-links";
import { UserAvatar } from "@/components/brand/user-avatar";
import { MY_PFP } from "@/lib/data/nft-pfp";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHQ } from "@/store/hq-store";
import type { NavItem } from "@/lib/types";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Compact desktop icon rail (Twitch-inspired). */
function RailItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              "group relative flex w-full flex-col items-center gap-1 rounded-lg py-2 text-[9px] font-semibold tracking-wide transition-colors",
              active ? "text-hq" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-hq" />
            )}
            <span
              className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                active ? "bg-hq/12" : "group-hover:bg-black/[0.05]"
              )}
            >
              <Icon name={item.icon} className="h-[18px] w-[18px]" />
              {item.badge && (
                <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hq opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-hq" />
                </span>
              )}
            </span>
            {item.title}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{item.title}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function Sidebar() {
  const isLoggedIn = useHQ((s) => s.isLoggedIn);
  const openLogin = useHQ((s) => s.openLogin);
  const user = useHQ((s) => s.currentUser);
  const open = useHQ((s) => s.sidebarOpen);
  const toggleSidebar = useHQ((s) => s.toggleSidebar);

  return (
    <>
      {/* Pull-out handle — slides with the rail to expand/collapse it */}
      <button
        onClick={toggleSidebar}
        aria-label={open ? "Collapse menu" : "Expand menu"}
        className={cn(
          "fixed top-1/2 z-40 flex h-12 w-5 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-black/10 bg-card text-muted-foreground shadow-md transition-[left] duration-300 ease-in-out hover:text-foreground",
          open ? "left-[74px]" : "left-0"
        )}
      >
        {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      <aside
        className={cn(
          "cardstock shrink-0 overflow-hidden border-black/10 transition-[width] duration-300 ease-in-out",
          open ? "w-[74px] border-r" : "w-0"
        )}
      >
      <div className="flex h-full w-[74px] flex-col items-center gap-1 px-1.5 py-3">
        {NAV.map((item) => (
          <RailItem key={item.href} item={item} />
        ))}

        <div className="flex-1" />

        {NAV_SECONDARY.map((item) => (
          <RailItem key={item.href} item={item} />
        ))}

        <div className="my-1 h-px w-8 bg-black/10" />

        {isLoggedIn ? (
          <Link href="/leaders" className="py-1" title={user.displayName}>
            <UserAvatar name={user.displayName} platform="hq" size="md" online ring={false} nft nftSrc={MY_PFP} />
          </Link>
        ) : (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={openLogin}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-hq/12 text-hq transition-colors hover:bg-hq/20"
                >
                  <LogIn className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Join HQ</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      </aside>
    </>
  );
}

/** Fuller nav used in the mobile slide-over sheet. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const user = useHQ((s) => s.currentUser);
  const isLoggedIn = useHQ((s) => s.isLoggedIn);
  const openLogin = useHQ((s) => s.openLogin);

  const Row = ({ item }: { item: NavItem }) => {
    const active = isActive(pathname, item.href);
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-hq/12 text-hq"
            : "text-muted-foreground hover:bg-black/[0.04] hover:text-foreground"
        )}
      >
        <Icon name={item.icon} className="h-[18px] w-[18px]" />
        <span className="flex-1">{item.title}</span>
        {item.badge && (
          <span className="flex items-center gap-1 rounded-full bg-hq/15 px-2 py-0.5 text-[9px] font-bold uppercase text-hq">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-hq" />
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col gap-1 p-3">
      <div className="px-2 py-3">
        <Logo />
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => (
          <Row key={item.href} item={item} />
        ))}
        <div className="my-2 h-px w-full bg-black/10" />
        {NAV_SECONDARY.map((item) => (
          <Row key={item.href} item={item} />
        ))}
      </nav>
      <div className="mb-3 px-1">
        <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Follow Market Bubble
        </p>
        <SocialLinks />
      </div>
      {isLoggedIn ? (
        <div className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-black/[0.02] p-3">
          <UserAvatar name={user.displayName} platform="hq" size="md" online nft nftSrc={MY_PFP} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.displayName}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              Lv {user.level} · {levelTitle(user.level)}
            </p>
          </div>
        </div>
      ) : (
        <button
          onClick={openLogin}
          className="rounded-xl bg-hq px-3 py-3 text-sm font-semibold text-primary-foreground"
        >
          Join Market Bubble HQ
        </button>
      )}
    </div>
  );
}
