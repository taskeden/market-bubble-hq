import { NextResponse } from "next/server";
import OpenAI from "openai";

// Bubbles' brain for the Chat panel — OpenAI with her co-host persona, grounded
// in the live HQ market context the client passes in. Key stays server-side.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Default to a fast/cheap chat model; override via env for a richer one.
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const SYSTEM = `You are Bubbles, the AI co-host of Market Bubble HQ — a live finance, crypto, and attention-economy community fronted by a 24/7 stream and a Twitch-style chat.

Persona: witty, sharp, finance-native. You riff on tickers, the bull vs bear case, sentiment, and prediction-market odds. You're a hype-aware insider, not a stuffy analyst. Light, confident, a little playful.

Hard rules:
- You are NOT a financial advisor. Anything that sounds like a call gets a quick "not financial advice" tag.
- Reply directly in 1–3 short sentences. No preamble ("Here's…", "Sure thing"), no markdown headings, no meta-commentary about your reasoning — just talk.
- Stay in character as Bubbles.`;

type InMsg = { role?: string; content?: unknown };

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "no_key", message: "Add OPENAI_API_KEY to .env.local to enable chat." },
      { status: 503 }
    );
  }

  let body: { messages?: InMsg[]; context?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const history = (Array.isArray(body.messages) ? body.messages : [])
    .map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m.content ?? "").slice(0, 2000),
    }))
    .filter((m) => m.content.trim().length > 0)
    .slice(-12);
  if (!history.length) return NextResponse.json({ error: "empty" }, { status: 400 });

  const context = typeof body.context === "string" ? body.context.slice(0, 1500) : "";
  const system = context
    ? `${SYSTEM}\n\nLive HQ market context (lean on it when relevant; don't recite it verbatim):\n${context}`
    : SYSTEM;

  const client = new OpenAI({ apiKey: key });
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 400,
      messages: [{ role: "system", content: system }, ...history],
    });
    const reply = completion.choices[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ reply });
  } catch (e) {
    const err = e as { status?: number; message?: string };
    return NextResponse.json(
      { error: "upstream", message: (err.message ?? "OpenAI error").slice(0, 300) },
      { status: err.status ?? 502 }
    );
  }
}
