"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Mic } from "lucide-react";
import { useHQ } from "@/store/hq-store";
import { cn } from "@/lib/utils";

const GOLD = "#a8843a";

type Turn = { role: "user" | "assistant"; content: string };

const OPENER =
  "Markets are live and chat's loud. Ask me anything — a ticker, the bull or bear case, what the room's leaning. Not financial advice, obviously.";

/** Live market snapshot from the store, handed to Claude as grounding context. */
function useMarketContext() {
  const trendingStocks = useHQ((s) => s.trendingStocks);
  const trendingTopics = useHQ((s) => s.trendingTopics);
  const sentiment = useHQ((s) => s.stats.sentiment);
  return () => {
    const stocks = trendingStocks
      .slice(0, 6)
      .map(
        (s) =>
          `$${s.ticker} ${s.change >= 0 ? "+" : ""}${s.change.toFixed(1)}% (${s.mentions} mentions, ${s.sentiment})`
      )
      .join(", ");
    const topics = trendingTopics
      .slice(0, 5)
      .map((t) => `${t.label} ${t.velocity >= 0 ? "+" : ""}${t.velocity}%`)
      .join(", ");
    return [
      `Sentiment: ${sentiment.bullish}% bullish / ${sentiment.bearish}% bearish / ${sentiment.neutral}% neutral.`,
      stocks && `Trending tickers: ${stocks}.`,
      topics && `Trending topics: ${topics}.`,
    ]
      .filter(Boolean)
      .join("\n");
  };
}

/** A real chat thread with Bubbles — type to her, she replies via Claude. Renders
 *  on the light co-host card, so text stays dark. */
export function ChatPanel({ onSwitchToVoice }: { onSwitchToVoice?: () => void }) {
  const buildContext = useMarketContext();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [noKey, setNoKey] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, pending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || pending) return;
    const next = [...turns, { role: "user" as const, content: text }];
    setTurns(next);
    setInput("");
    setPending(true);
    try {
      const r = await fetch("/api/bubbles/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, context: buildContext() }),
      });
      if (r.status === 503) {
        setNoKey(true);
        return;
      }
      const data = await r.json().catch(() => ({}));
      const reply = (data.reply as string) || "Hmm, my feed cut out — try me again.";
      setTurns((t) => [...t, { role: "assistant", content: reply }]);
    } catch {
      setTurns((t) => [...t, { role: "assistant", content: "Connection blipped — say that again?" }]);
    } finally {
      setPending(false);
    }
  }

  if (noKey) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <p className="text-[12px] font-semibold text-black/75">Connect OpenAI</p>
        <p className="px-2 text-[11px] leading-snug text-black/50">
          Add <code className="rounded bg-black/[0.06] px-1 py-0.5 text-[10px]">OPENAI_API_KEY</code>{" "}
          to <code className="rounded bg-black/[0.06] px-1 py-0.5 text-[10px]">.env.local</code> and
          restart to chat with Bubbles.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div
        ref={scrollRef}
        className="max-h-[244px] min-h-[120px] space-y-2 overflow-y-auto pr-1 text-[13px] leading-snug"
      >
        {turns.length === 0 && (
          <p className="rounded-lg bg-black/[0.03] px-3 py-2 text-black/70">{OPENER}</p>
        )}
        {turns.map((t, i) => (
          <div key={i} className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}>
            <span
              className={cn(
                "inline-block max-w-[85%] rounded-2xl px-3 py-1.5",
                t.role === "user"
                  ? "bg-bubble text-bubble-foreground"
                  : "bg-black/[0.05] text-black/85"
              )}
            >
              {t.content}
            </span>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <span className="inline-flex items-center gap-1 rounded-2xl bg-black/[0.05] px-3 py-2">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-black/40"
                  animate={{ y: [0, -3, 0], opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        {onSwitchToVoice && (
          <button
            onClick={onSwitchToVoice}
            aria-label="Switch to voice"
            title="Switch to voice"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-black/[0.08] bg-black/[0.02] text-black/55 transition-colors hover:border-black/15 hover:text-black"
          >
            <Mic className="h-4 w-4" />
          </button>
        )}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask Bubbles…"
          className="min-w-0 flex-1 rounded-lg border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-[13px] text-black placeholder:text-black/35 focus:border-black/20 focus:outline-none"
          style={{ caretColor: GOLD }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || pending}
          aria-label="Send"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bubble text-bubble-foreground transition-transform enabled:hover:scale-105 disabled:opacity-40"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
