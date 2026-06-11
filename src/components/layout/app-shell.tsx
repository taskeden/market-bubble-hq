"use client";

import { type ReactNode, useState } from "react";
import { syncDemoFromUrl } from "@/lib/demo";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { ProfilePanel } from "@/components/community/profile-panel";
import { TickerTape } from "@/components/broadcast/ticker-tape";
import { BubblesDock } from "@/components/bubbles/bubbles-dock";
import { LoginModal } from "@/components/community/login-modal";
import { WelcomeMoment } from "@/components/community/welcome-moment";
import { useHQEngine } from "@/hooks/use-hq-engine";

export function AppShell({ children }: { children: ReactNode }) {
  // Persist ?demo=1 before the engine reads the data mode, so demo survives nav.
  useState(() => {
    syncDemoFromUrl();
    return null;
  });
  useHQEngine();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Topbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="desk-scroll min-h-0 min-w-0 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </main>
      </div>
      {/* Broadcast market-watch ticker spans the full base of the desk */}
      <TickerTape />
      <ProfilePanel />
      <BubblesDock />
      <LoginModal />
      <WelcomeMoment />
    </div>
  );
}
