"use client";

import { useEffect, useRef, useState } from "react";

// Full-site intro: plays the metal-stamp logo reveal on first paint, then fades
// to reveal the site. Mounted in the root layout so it covers the entire site
// (and, conveniently, masks the stream's initial YouTube chrome flash).

const FADE_MS = 650;
const HOLD_MS = 2600; // fade starts here; the 4.0s clip keeps moving until fully faded
const HARD_CAP_MS = 4500; // dismiss even if the video never plays (autoplay blocked / decode fail)

export function SiteIntro() {
  const [phase, setPhase] = useState<"playing" | "leaving" | "done">("playing");
  const videoRef = useRef<HTMLVideoElement>(null);
  const leftRef = useRef(false);

  const dismiss = () => {
    if (leftRef.current) return;
    leftRef.current = true;
    setPhase("leaving");
    window.setTimeout(() => setPhase("done"), FADE_MS);
  };

  // Respect reduced-motion — skip the reveal for users who opt out of animation.
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      leftRef.current = true;
      setPhase("done");
    }
  }, []);

  // Wall-clock timing (not the video's `ended` event, which is unreliable across
  // fast-play / slow-load / unsupported-codec): lock scroll, start playback, and
  // dismiss HOLD_MS after it begins playing, with a hard cap as a safety net.
  useEffect(() => {
    if (phase === "done") {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const v = videoRef.current;
    v?.play?.().catch(() => {});

    let holdTimer = 0;
    const onPlaying = () => {
      window.clearTimeout(holdTimer);
      holdTimer = window.setTimeout(dismiss, HOLD_MS);
    };
    v?.addEventListener("playing", onPlaying);
    const hardCap = window.setTimeout(dismiss, HARD_CAP_MS);

    return () => {
      v?.removeEventListener("playing", onPlaying);
      window.clearTimeout(holdTimer);
      window.clearTimeout(hardCap);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === "done"]);

  if (phase === "done") return null;

  return (
    <div
      onClick={dismiss}
      role="presentation"
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#d9d8dd] transition-opacity ease-out"
      style={{ opacity: phase === "leaving" ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}
    >
      {/* Fully rendered clip (scripts/render_intro.py): letterpress press-in +
          float-precision drift, all baked into the frames — the browser animates
          NOTHING (client-side transforms shimmered/shook the paper grain). */}
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        autoPlay
        muted
        playsInline
        preload="auto"
        tabIndex={-1}
        poster="/brand/intro-poster.jpg"
        disablePictureInPicture
      >
        <source src="/brand/intro.webm" type="video/webm" />
        <source src="/brand/intro.mp4" type="video/mp4" />
      </video>

      <span className="pointer-events-none absolute bottom-6 right-7 text-[10px] font-semibold uppercase tracking-[0.28em] text-black/30">
        Skip
      </span>
    </div>
  );
}
