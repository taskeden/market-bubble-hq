"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { NewsTicker } from "@/components/broadcast/news-ticker";
import { HeadlineChyron } from "@/components/broadcast/chyron";
import { WorldClocks } from "@/components/broadcast/world-clocks";
import { ThemeToggle } from "./theme-toggle";
import { UserAvatar } from "@/components/brand/user-avatar";
import { MY_PFP } from "@/lib/data/nft-pfp";
import { useHQ } from "@/store/hq-store";
import { cn, formatNumber } from "@/lib/utils";

/**
 * Broadcast strip. The brand plate anchors the left; the middle shows the
 * rotating headline ticker at the top of the page (clocks alongside) and
 * cross-fades to the live HQ Newsdesk alerts on scroll, the clocks sliding
 * away to give the crawl the full width.
 */
export function Topbar() {
  const isLoggedIn = useHQ((s) => s.isLoggedIn);
  const openLogin = useHQ((s) => s.openLogin);
  const points = useHQ((s) => s.points);
  const currentUser = useHQ((s) => s.currentUser);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const onScroll = () => setScrolled(main.scrollTop > 8);
    main.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => main.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="cardstock z-30 flex h-16 shrink-0 items-center gap-3 px-4 lg:px-6">
      {/* Brand logo — transparent wordmark: black on the light desk, white on dark */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/market-bubble-logo-2-black.png"
        alt="Market Bubble"
        draggable={false}
        className="h-12 w-auto shrink-0 select-none object-contain dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/market-bubble-logo-2-white.png"
        alt="Market Bubble"
        draggable={false}
        className="hidden h-12 w-auto shrink-0 select-none object-contain dark:block"
      />

      {/* Middle — rotating headline ticker at the top of the page; once you
          scroll it cross-fades to the live HQ alerts crawl (clocks slide away). */}
      <div className="relative ml-3 flex min-w-0 flex-1 self-stretch">
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            !scrolled && "pointer-events-none opacity-0"
          )}
        >
          <NewsTicker bare className="h-full w-full" />
        </div>
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex w-full items-center transition-opacity duration-500",
            scrolled && "pointer-events-none opacity-0"
          )}
        >
          <HeadlineChyron noPlate className="min-w-0 flex-1" />
        </div>
      </div>

      {/* World clocks — visible at the top of the page, collapse on scroll */}
      <div
        className={cn(
          "hidden shrink-0 overflow-hidden transition-all duration-500 ease-out lg:block",
          scrolled ? "max-w-0 opacity-0" : "max-w-[460px] opacity-100"
        )}
      >
        {/* Symmetric px so the clocks breathe equally off the chyron plate
            (left) and the theme toggle (right). */}
        <WorldClocks className="w-max px-5" />
      </div>

      {/* Dark-mode toggle — back next to Join HQ */}
      <ThemeToggle />

      {/* Join HQ (or the member chip) — pinned to the far right */}
      {isLoggedIn ? (
        <button className="flex shrink-0 items-center gap-2 rounded-full border border-black/[0.08] bg-card/70 py-1 pl-1 pr-3 transition-colors hover:border-hq/30">
          <UserAvatar name={currentUser.displayName} platform="hq" size="sm" ring={false} nft nftSrc={MY_PFP} />
          <div className="hidden text-left leading-none sm:block">
            <div className="text-xs font-semibold">{currentUser.displayName}</div>
            <div className="tabular text-[10px] font-medium text-gold">
              {formatNumber(points)} pts
            </div>
          </div>
        </button>
      ) : (
        <Button size="sm" onClick={openLogin} className="shrink-0 font-semibold">
          Join HQ
        </Button>
      )}
    </header>
  );
}
