"use client";

import { useState } from "react";
import { useHQ } from "@/store/hq-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Composer({
  overlay = false,
  placeholder = "Send a message",
}: {
  overlay?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const sendNative = useHQ((s) => s.sendNative);
  const isLoggedIn = useHQ((s) => s.isLoggedIn);
  const openLogin = useHQ((s) => s.openLogin);
  const addPoints = useHQ((s) => s.addPoints);

  const submit = () => {
    if (!isLoggedIn) return openLogin();
    if (!value.trim()) return;
    sendNative(value);
    addPoints(5);
    setValue("");
  };

  // ── Logged-out: looks like a normal composer; any interaction opens login ───
  if (!isLoggedIn) {
    return (
      <div
        className={cn(
          "border-t border-black/[0.06] bg-card/40 p-2.5 backdrop-blur-xl",
          overlay && "lg:border-white/10 lg:bg-black/25 lg:backdrop-blur-none"
        )}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openLogin}
            className={cn(
              "flex h-8 flex-1 items-center rounded-lg border border-black/[0.08] bg-black/[0.03] px-2.5 text-left text-[12px] text-muted-foreground/75 transition-colors hover:border-hq/40",
              overlay && "lg:border-white/15 lg:bg-white/10 lg:text-white/55"
            )}
          >
            {placeholder}
          </button>
          <Button
            size="icon-sm"
            aria-label="Send a message"
            onClick={openLogin}
            className="h-8 w-8 shrink-0 rounded-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/market-bubble-mark-white.png"
              alt=""
              aria-hidden
              draggable={false}
              className="h-4 w-4 object-contain"
            />
          </Button>
        </div>
      </div>
    );
  }

  // ── Logged-in composer ──────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "border-t border-black/[0.06] bg-card/40 p-2.5 backdrop-blur-xl",
        overlay && "lg:border-white/10 lg:bg-black/25 lg:backdrop-blur-none"
      )}
    >
      <div className="flex items-end gap-2">
        <div
          className={cn(
            "flex flex-1 items-end gap-2 rounded-lg border border-black/[0.08] bg-black/[0.03] px-2.5 py-1.5 transition-colors focus-within:border-hq/40",
            overlay && "lg:border-white/15 lg:bg-white/10"
          )}
        >
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder={placeholder}
            className={cn(
              "max-h-28 flex-1 resize-none bg-transparent py-0.5 text-[12px] outline-none placeholder:text-muted-foreground/70",
              overlay && "lg:text-white lg:placeholder:text-white/50"
            )}
          />
        </div>
        <Button size="icon-sm" onClick={submit} disabled={!value.trim()} className="h-8 w-8 shrink-0 rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/market-bubble-mark-white.png"
            alt=""
            aria-hidden
            draggable={false}
            className="h-4 w-4 -translate-x-px object-contain"
          />
        </Button>
      </div>
    </div>
  );
}
