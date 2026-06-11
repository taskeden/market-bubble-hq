"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Mic, MicOff, Loader2, PhoneOff, MessageSquare, KeyRound } from "lucide-react";
import { useHQ } from "@/store/hq-store";
import { cn } from "@/lib/utils";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

/** Turn a raw SDK/connection error into something a human can act on. */
function friendlyError(message?: string) {
  const m = (message || "").toLowerCase();
  if (
    m.includes("permission") ||
    m.includes("denied") ||
    m.includes("notallowed") ||
    m.includes("microphone") ||
    m.includes("getusermedia")
  )
    return "Microphone is blocked — allow mic access in your browser, then tap to retry.";
  if (m.includes("override"))
    return "Turn on voice overrides in the agent's ElevenLabs security settings.";
  return message || "Voice connection failed — tap to retry.";
}

/** A stretched "talking effect" — a row of bars that come alive when the line is
 *  open, and dance harder while Bubbles is speaking. */
function Waveform({ active, speaking }: { active: boolean; speaking: boolean }) {
  const bars = 22;
  return (
    <div className="flex h-6 flex-1 items-center justify-center gap-[3px]">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.span
          key={i}
          className="w-[3px] origin-center rounded-full"
          style={{
            height: 20,
            background: speaking ? "hsl(var(--hq))" : "rgba(0,0,0,0.4)",
          }}
          animate={
            active
              ? { scaleY: [0.2, speaking ? 1 : 0.55, 0.2] }
              : { scaleY: 0.18 }
          }
          transition={
            active
              ? {
                  duration: 0.5 + (i % 5) * 0.09,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: (i % 7) * 0.05,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

/** A small round icon button used for the collapsed "switch modes" affordance. */
function SwitchIcon({
  onClick,
  label,
  children,
}: {
  onClick?: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-black/[0.08] bg-black/[0.02] text-black/55 transition-colors hover:border-black/15 hover:text-black"
    >
      {children}
    </button>
  );
}

/** Hands-free voice conversation with Bubbles via an ElevenLabs Conversational AI
 *  agent. The voice "talking effect" stretches across the bottom bar; a small chat
 *  icon on the right switches back to typing. Renders on the light co-host card. */
function VoiceInner({ onSwitchToChat }: { onSwitchToChat?: () => void }) {
  const voiceId = useHQ((s) => s.bubblesVoiceId);

  const [phase, setPhase] = useState<"idle" | "connecting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // The minted session token + whether we've already fallen back to the agent's
  // default voice, so the error handler can retry cleanly without a stale closure.
  const tokenRef = useRef<string | null>(null);
  const retriedRef = useRef(false);
  // Lets `onError` re-open a session without referencing `conversation` before it
  // is declared (TDZ); refreshed every render with the live startSession.
  const reconnectRef = useRef<(withVoice: boolean) => void>(() => {});

  // Lifecycle callbacks live on the hook (the documented, always-registered spot)
  // so status + errors surface reliably instead of being swallowed mid-connect.
  const conversation = useConversation({
    onConnect: () => setPhase("idle"),
    onDisconnect: () => setPhase("idle"),
    onError: (message?: string) => {
      // A rejected voice override (overrides not enabled in the agent's security
      // settings) kills the connect. Retry once in the agent's default voice so
      // Talk still works, then surface anything that fails after that.
      if (!retriedRef.current && voiceId && tokenRef.current) {
        retriedRef.current = true;
        reconnectRef.current(false);
        return;
      }
      setError(friendlyError(message));
      setPhase("error");
    },
  });
  const { status, isSpeaking, isMuted, setMuted } = conversation;

  const live = status === "connected";
  const connecting = phase === "connecting" || status === "connecting";

  // Open a WebRTC session for the already-minted token, optionally forcing her
  // pinned voice. Kept in a ref so the hook's onError can call the latest copy.
  const beginSession = useCallback(
    (withVoice: boolean) => {
      if (!tokenRef.current) return;
      conversation.startSession({
        conversationToken: tokenRef.current,
        connectionType: "webrtc",
        ...(withVoice && voiceId ? { overrides: { tts: { voiceId } } } : {}),
      });
    },
    [conversation, voiceId]
  );
  reconnectRef.current = beginSession;

  const start = useCallback(async () => {
    setError(null);
    retriedRef.current = false;
    tokenRef.current = null;
    setPhase("connecting");

    // 1) Prime the mic up front — this surfaces a blocked mic instantly and with
    // a clear message, instead of an opaque failure deep in WebRTC negotiation.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setError("Microphone is blocked — allow mic access in your browser, then tap to retry.");
      setPhase("error");
      return;
    }

    // 2) Mint a session token, then open the conversation.
    try {
      const r = await fetch("/api/bubbles/conversation-token");
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(d.message || "Couldn't reach the voice agent — try again in a moment.");
        setPhase("error");
        return;
      }
      const { token } = await r.json();
      tokenRef.current = token;
      beginSession(true);
    } catch {
      setError("Couldn't reach the voice agent — check your connection and retry.");
      setPhase("error");
    }
  }, [beginSession]);

  const stop = useCallback(() => {
    conversation.endSession();
    setPhase("idle");
  }, [conversation]);

  if (!voiceId) {
    return (
      <p className="px-2 py-6 text-center text-[11px] leading-snug text-black/50">
        Pin her voice first (set{" "}
        <code className="rounded bg-black/[0.06] px-1 py-0.5 text-[10px]">
          NEXT_PUBLIC_ELEVENLABS_VOICE_ID
        </code>
        ) so she speaks as Bubbles.
      </p>
    );
  }

  const statusLabel = live
    ? isSpeaking
      ? "Bubbles is talking"
      : "Listening…"
    : connecting
      ? "Connecting…"
      : phase === "error"
        ? "Tap to retry"
        : "Tap to talk markets out loud";

  return (
    <div className="mt-3">
      <p
        className={cn(
          "min-h-[1.4em] text-center text-[12px] font-semibold",
          isSpeaking ? "text-hq" : "text-black/60"
        )}
      >
        {statusLabel}
      </p>
      {phase === "error" && error && (
        <p className="mt-1 px-2 text-center text-[11px] leading-snug text-hq/80">{error}</p>
      )}

      {/* Bottom bar: the voice "talking effect" stretches across; controls + the
          small chat icon sit on the right. */}
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={live ? () => setMuted(!isMuted) : start}
          disabled={connecting}
          className={cn(
            "flex h-11 flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl border px-3 transition-colors",
            live
              ? "border-black/10 bg-black/[0.03]"
              : "border-transparent bg-ink text-white hover:scale-[1.01]"
          )}
        >
          {connecting ? (
            <Loader2 className="h-4 w-4 animate-spin text-black/50" />
          ) : live ? (
            <>
              {isMuted ? (
                <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-black/55">
                  <MicOff className="h-4 w-4" /> Muted
                </span>
              ) : (
                <Waveform active={live} speaking={isSpeaking} />
              )}
            </>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.06em]">
              <Mic className="h-4 w-4" /> {phase === "error" ? "Try again" : "Start talking"}
            </span>
          )}
        </button>

        {live && (
          <button
            onClick={stop}
            aria-label="End call"
            title="End"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-hq text-white transition-transform hover:scale-105"
          >
            <PhoneOff className="h-4 w-4" />
          </button>
        )}

        {/* collapsed chat affordance — switch back to typing */}
        <SwitchIcon onClick={onSwitchToChat} label="Switch to chat">
          <MessageSquare className="h-4 w-4" />
        </SwitchIcon>
      </div>
    </div>
  );
}

/** Setup gate — if no agent id is configured, explain what to create. */
export function VoiceConversation({ onSwitchToChat }: { onSwitchToChat?: () => void }) {
  if (!AGENT_ID) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] text-black/45">
          <KeyRound className="h-4 w-4" />
        </span>
        <p className="text-[12px] font-semibold text-black/75">Connect a voice agent</p>
        <p className="px-2 text-[11px] leading-snug text-black/50">
          Create an ElevenLabs Conversational AI agent (assign her voice + a Bubbles persona),
          then set{" "}
          <code className="rounded bg-black/[0.06] px-1 py-0.5 text-[10px]">
            NEXT_PUBLIC_ELEVENLABS_AGENT_ID
          </code>{" "}
          and restart.
        </p>
      </div>
    );
  }
  return (
    <ConversationProvider>
      <VoiceInner onSwitchToChat={onSwitchToChat} />
    </ConversationProvider>
  );
}
