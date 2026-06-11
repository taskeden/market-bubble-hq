"use client";

import { OnAirQueue } from "./on-air-queue";
import { TopQuestions } from "./top-questions";
import { HotTickers } from "./hot-tickers";
import { VelocityPanel } from "./velocity-panel";

/** The desk's right hand: queue → questions → tickers → pulse. Each panel
    subscribes independently, so sim ticks never re-render the rail itself. */
export function TerminalRail() {
  return (
    <div className="no-scrollbar flex h-full min-h-0 flex-col gap-5 overflow-y-auto py-4">
      <OnAirQueue />
      <Rule />
      <TopQuestions />
      <Rule />
      <HotTickers />
      <Rule />
      <VelocityPanel />
    </div>
  );
}

function Rule() {
  return <div className="mx-4 h-px shrink-0 bg-white/[0.07]" aria-hidden />;
}
