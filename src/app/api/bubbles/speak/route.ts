import { NextResponse } from "next/server";

// Text-to-speech for Bubbles — turns a line of her dialogue into audio in the
// chosen ElevenLabs voice. POST { text, voiceId? }. The voiceId falls back to
// the pinned default. Returns audio/mpeg the browser can play directly.

export const runtime = "nodejs";

const DEFAULT_VOICE = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || "";
const MODEL = "eleven_multilingual_v2";

export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "no_key", message: "Add ELEVENLABS_API_KEY to .env.local to enable voice." },
      { status: 503 }
    );
  }

  let body: { text?: string; voiceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const text = (body.text ?? "").trim().slice(0, 600);
  const voiceId = body.voiceId || DEFAULT_VOICE;
  if (!text) return NextResponse.json({ error: "empty_text" }, { status: 400 });
  if (!voiceId) return NextResponse.json({ error: "no_voice" }, { status: 400 });

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": key,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: MODEL,
          voice_settings: { stability: 0.4, similarity_boost: 0.8, style: 0.3 },
        }),
      }
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "upstream", status: res.status, message: detail.slice(0, 300) },
        { status: 502 }
      );
    }
    const audio = await res.arrayBuffer();
    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }
}
