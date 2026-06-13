import { NextResponse } from "next/server";
import { SITE } from "@/lib/config";

// Real Twitch live status via Twitch's public web GQL endpoint — the same
// anonymous Client-ID twitch.tv uses in the browser, so no account or API key is
// required. This lets the hero switch to the live Twitch stream the moment the
// host goes live there, independent of the YouTube live detector (which only
// catches a YouTube simulcast).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko";
// Sanitize: Twitch logins are [a-z0-9_] only — also guards the inline query.
const CHANNEL = (process.env.NEXT_PUBLIC_TWITCH_CHANNEL || SITE.twitch).replace(/[^a-z0-9_]/gi, "");

export async function GET() {
  try {
    const res = await fetch("https://gql.twitch.tv/gql", {
      method: "POST",
      headers: { "Client-ID": PUBLIC_CLIENT_ID, "Content-Type": "application/json" },
      body: JSON.stringify({ query: `query{user(login:"${CHANNEL}"){stream{type}}}` }),
      cache: "no-store",
    });
    const data = res.ok ? await res.json() : null;
    const live = data?.data?.user?.stream?.type === "live";
    return NextResponse.json({ live, channel: CHANNEL });
  } catch {
    return NextResponse.json({ live: false, channel: CHANNEL });
  }
}
