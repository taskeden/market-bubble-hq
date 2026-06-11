import { NextResponse } from "next/server";

// Voice catalog for the Bubbles co-host — proxies ElevenLabs so we can audition
// and pick her voice in-app. The API key stays server-side; the browser only
// ever sees voice metadata + ElevenLabs' own (free) preview clips.

// Always fresh — a voice the user just created in ElevenLabs should appear
// the next time they open the picker, so we don't cache the catalog.
export const dynamic = "force-dynamic";

export type BubblesVoice = {
  voiceId: string;
  name: string;
  gender: string | null;
  accent: string | null;
  description: string | null;
  previewUrl: string | null;
};

type ElevenVoice = {
  voice_id: string;
  name: string;
  preview_url?: string | null;
  labels?: Record<string, string> | null;
};

export async function GET() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "no_key", message: "Add ELEVENLABS_API_KEY to .env.local to load voices." },
      { status: 503 }
    );
  }

  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": key },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "upstream", message: `ElevenLabs responded ${res.status}.` },
        { status: 502 }
      );
    }
    const data = (await res.json()) as { voices?: ElevenVoice[] };
    const voices: BubblesVoice[] = (data.voices ?? []).map((v) => ({
      voiceId: v.voice_id,
      name: v.name,
      gender: v.labels?.gender ?? null,
      accent: v.labels?.accent ?? null,
      description: v.labels?.description ?? null,
      previewUrl: v.preview_url ?? null,
    }));
    // Female-leaning voices first — Bubbles is "her" — then alphabetical.
    voices.sort((a, b) => {
      const af = a.gender === "female" ? 0 : 1;
      const bf = b.gender === "female" ? 0 : 1;
      return af - bf || a.name.localeCompare(b.name);
    });
    return NextResponse.json({ voices });
  } catch {
    return NextResponse.json(
      { error: "fetch_failed", message: "Could not reach ElevenLabs." },
      { status: 502 }
    );
  }
}
