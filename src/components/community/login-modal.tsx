"use client";

import { useState } from "react";
import { Check, Sparkles, Trophy, MessageSquare, Coins } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BubbleMark } from "@/components/brand/logo";
import { PlatformIcon } from "@/components/brand/platform-icon";
import { PLATFORM_ORDER } from "@/lib/config";
import { useHQ } from "@/store/hq-store";
import { cn } from "@/lib/utils";

const PERKS = [
  { icon: MessageSquare, label: "Chat in the shared HQ room" },
  { icon: Coins, label: "Earn points for every message" },
  { icon: Trophy, label: "Climb the community leaderboard" },
  { icon: Sparkles, label: "Ask Bubbles for market intel" },
];

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function LoginModal() {
  const open = useHQ((s) => s.loginOpen);
  const closeLogin = useHQ((s) => s.closeLogin);
  const login = useHQ((s) => s.login);
  const [name, setName] = useState("Noah");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);

  // Email is required to sign up — every path runs through here.
  const submit = () => {
    if (!isValidEmail(email)) {
      setEmailError(true);
      return;
    }
    login(name.trim() || "Member", email.trim());
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeLogin()}>
      <DialogContent className="max-w-md overflow-hidden border-black/10 bg-paper p-0 text-paper-foreground">
        {/* Header band */}
        <div className="relative overflow-hidden bg-ink px-6 pb-5 pt-6 text-paper">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-hq/30 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <BubbleMark className="h-9 w-9 invert" />
            <div>
              <h2 className="font-display text-xl font-bold leading-none">Join Market Bubble HQ</h2>
              <p className="mt-1 text-[12px] text-paper/70">
                Watch from the outside — or log in and join the real ones inside.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          {/* Unified room visual */}
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              You&apos;ll be chatting alongside
            </p>
            <div className="flex items-center gap-2">
              {PLATFORM_ORDER.map((p) => (
                <div key={p} className="flex items-center gap-1.5 rounded-md bg-black/[0.03] px-2 py-1.5">
                  <PlatformIcon platform={p} size="sm" />
                </div>
              ))}
              <span className="ml-1 text-xs text-muted-foreground">→ one shared room</span>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Choose your HQ name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Your name"
              className="bg-white/60"
            />
          </div>

          {/* Email — required */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Email <span className="text-hq">*</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="you@email.com"
              aria-invalid={emailError}
              className={cn("bg-white/60", emailError && "border-hq focus-visible:ring-hq/40")}
            />
            {emailError && (
              <p className="mt-1.5 text-[11px] font-medium text-hq">
                Enter a valid email to join.
              </p>
            )}
          </div>

          {/* Perks */}
          <div className="grid grid-cols-2 gap-2">
            {PERKS.map((p) => (
              <div key={p.label} className="flex items-center gap-2 text-[12px] text-foreground/80">
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                {p.label}
              </div>
            ))}
          </div>

          <Button onClick={submit} size="lg" className="w-full">
            Join HQ — it&apos;s free
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="flex-1" onClick={submit}>
              <PlatformIcon platform="x" size="sm" /> Continue with X
            </Button>
            <Button variant="outline" className="flex-1" onClick={submit}>
              <PlatformIcon platform="twitch" size="sm" /> Twitch
            </Button>
          </div>

          <p className="text-center text-[10px] text-muted-foreground">
            The real ones log in. Not financial advice — just the realest market room online.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
