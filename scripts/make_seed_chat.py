"""Bake a real exported chat log into a committed seed module.

The LIVE feed is real-only, so on a fresh browser / the deployed site (which has
no on-device `mb-chat-log` yet) it would open empty between streams. This turns a
real exported log into `src/lib/data/seed-chat.ts` so the feed instead opens with
the actual last-stream conversation. The on-device rolling log overrides it once a
visitor has their own capture; real live chat appends on top.

Export a log from the browser console on the running site:
    copy(localStorage.getItem('mb-chat-log'))   # or download it to a file

Then regenerate:
    python scripts/make_seed_chat.py [path/to/mb-chat-log.json]

Default source path is the Downloads export. Deterministic: sorts by timestamp,
dedupes by id, keeps the most recent CAP messages.
"""

import json
import os
import sys

CAP = 220
DEFAULT_SRC = os.path.expanduser("~/Downloads/mb-chat-log.json")
OUT = "src/lib/data/seed-chat.ts"

REQUIRED = {
    "id", "platform", "source", "kind", "userId", "username", "displayName",
    "content", "timestamp", "role", "tickers", "sentiment", "mentionsBubbles",
}
# Only persist the fields the type defines, in a stable order (drops any stray keys).
KEEP = [
    "id", "platform", "source", "kind", "userId", "username", "displayName",
    "content", "timestamp", "role", "tickers", "sentiment", "mentionsBubbles",
    "hidden", "flagged", "reactions", "self",
]

HEADER = """// AUTO-GENERATED — do not edit by hand. Regenerate with scripts/make_seed_chat.py
// from an exported mb-chat-log.json.
//
// A real chat log from the last Market Bubble stream (Banks on Twitch + Ansem on
// Kick). The LIVE feed is real-only, so on a fresh browser / the deployed site
// (no on-device log yet) it would open empty between streams — this seeds it with
// the real last-stream conversation instead. The rolling on-device log
// (mb-chat-log) overrides this once a visitor has their own capture, and real live
// chat appends on top. Authentic capture, never the simulation crowd.
import type { ChatMessage } from "../types";

export const SEED_CHAT: ChatMessage[] = """


def main() -> None:
    src = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SRC
    with open(src, encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise SystemExit(f"{src} is not a JSON array")

    by_id = {}
    for m in data:
        if not isinstance(m, dict) or not REQUIRED.issubset(m.keys()):
            continue
        by_id[m["id"]] = {k: m[k] for k in KEEP if k in m}

    rows = sorted(by_id.values(), key=lambda m: m["timestamp"])[-CAP:]
    body = json.dumps(rows, ensure_ascii=False, indent=2)
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(HEADER + body + ";\n")
    print(f"wrote {OUT} — {len(rows)} messages from {src}")


if __name__ == "__main__":
    main()
