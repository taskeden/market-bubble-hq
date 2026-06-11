import { NextResponse } from "next/server";

// Mints a short-lived ElevenLabs Conversational AI session token for the Bubbles
// voice agent, so the browser can open a hands-free WebRTC conversation without
// ever seeing the API key. Requires ELEVENLABS_API_KEY + an agent id.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AGENT_ID =
  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || process.env.ELEVENLABS_AGENT_ID || "";

export async function GET() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "no_key", message: "Add ELEVENLABS_API_KEY to .env.local." },
      { status: 503 }
    );
  }
  if (!AGENT_ID) {
    return NextResponse.json(
      {
        error: "no_agent",
        message:
          "Create an ElevenLabs Conversational AI agent and set NEXT_PUBLIC_ELEVENLABS_AGENT_ID.",
      },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(AGENT_ID)}`,
      { headers: { "xi-api-key": key }, cache: "no-store" }
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "upstream", status: res.status, message: detail.slice(0, 300) },
        { status: 502 }
      );
    }
    const data = (await res.json()) as { token?: string };
    if (!data.token) {
      return NextResponse.json({ error: "no_token" }, { status: 502 });
    }
    return NextResponse.json({ token: data.token });
  } catch {
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }
}
