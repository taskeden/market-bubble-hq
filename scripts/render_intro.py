"""Programmatic letterpress intro renderer for Market Bubble HQ.

Rebuilds the site intro frame-by-frame from real brand assets — no AI footage:
  - paper synthesized from the site's own grain (public/brand/paper-grain.png),
    toned to match the brand banner's silver cardstock
  - the exact wordmark (market-bubble-logo-2-black.png) pressed in with a
    letterpress deboss (ink + pressed-edge shadow + light catch + contact shadow)
  - a continuous eased push-in computed as float-precision crop boxes at 4K,
    downscaled per frame with Lanczos (sub-pixel accurate => zero jitter)

Usage:
  python scripts/render_intro.py stills   # 3 key frames -> public/brand/_intro_preview/
  python scripts/render_intro.py render   # all frames -> encode intro.mp4/webm/poster
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "public" / "brand"

# ── canvas / timeline ────────────────────────────────────────────────────────
W, H = 3840, 2160          # composition resolution (4x supersample of output)
OUT_W, OUT_H = 1920, 1080
FPS = 24
N_FRAMES = 96              # 4.0s
T_TOTAL = N_FRAMES / FPS

ZOOM_MAX = 0.05            # 5% push-in across the whole clip

# press choreography (seconds) — a GRAND stamp: a long anticipation beat on the
# drifting paper, then a decisive press with a weighty settle and slow shadow bloom.
T_APPEAR = 0.75            # press begins after a stately beat of paper
T_INKED = 0.95             # ink fully opaque (~5 frames — decisive, not a fade)
T_SETTLED = 1.45           # scale + shadows fully settled (composition static after)

# ── look ─────────────────────────────────────────────────────────────────────
PAPER_BASE = np.array([219.0, 218.0, 222.0])   # silver cardstock (banner tone)
INK = np.array([23.0, 23.0, 26.0])             # near-black ink
INK_OPACITY = 0.94                             # texture breathes through the ink (banner-like)
LOGO_W_4K = 480                                # wordmark width on the 4K canvas (~12.5% of frame)
LOGO_LIFT = 0.012                              # optical centering: raise by 1.2% of H

SHADOW_EDGE_PX = 6         # pressed-edge shadow offset (4K px)
SHADOW_EDGE_BLUR = 7
SHADOW_EDGE_STR = 0.42
CATCH_PX = 5               # light catch below the deboss (4K px)
CATCH_BLUR = 6
CATCH_STR = 60.0           # additive brightness
CONTACT_BLUR = 22
CONTACT_STR = 0.085


def smoothstep(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return x * x * (3.0 - 2.0 * x)


def opacity_at(t: float) -> float:
    return smoothstep((t - T_APPEAR) / (T_INKED - T_APPEAR))


def logo_scale_at(t: float) -> float:
    """1.12 -> 0.992 (a weighty press) -> 1.0 with a slow recovery: grand, deliberate."""
    if t <= T_APPEAR:
        return 1.12
    if t <= 1.05:
        return 1.12 + (0.992 - 1.12) * smoothstep((t - T_APPEAR) / (1.05 - T_APPEAR))
    if t <= T_SETTLED:
        return 0.992 + (1.0 - 0.992) * smoothstep((t - 1.05) / (T_SETTLED - 1.05))
    return 1.0


def shadow_at(t: float) -> float:
    return smoothstep((t - 0.85) / 0.55)


def contact_at(t: float) -> float:
    """Contact shadow blooms with the press, then relaxes slowly to a resting level."""
    bloom = smoothstep((t - 0.88) / 0.20)
    relax = 1.0 - 0.40 * smoothstep((t - 1.15) / 0.45)
    return bloom * relax


def blur_map(a: np.ndarray, radius: float) -> np.ndarray:
    img = Image.fromarray(np.clip(a * 255.0, 0, 255).astype(np.uint8), "L")
    img = img.filter(ImageFilter.GaussianBlur(radius))
    return np.asarray(img).astype(np.float32) / 255.0


def banner_texture() -> np.ndarray:
    """Fiber detail sampled from the brand banner itself: a clean cardstock patch,
    high-passed (lighting removed) and normalized to unit std."""
    b = Image.open(BRAND / "Market bubble banner.png").convert("L")
    patch = np.asarray(b.crop((40, 330, 700, 630))).astype(np.float32)
    blur = np.asarray(
        Image.fromarray(patch.astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(20))
    ).astype(np.float32)
    tex = patch - blur
    return tex / max(float(tex.std()), 1e-6)


def synth_banner_texture(seed: int = 11, freq_scale: float = 1.0) -> np.ndarray:
    """Texture synthesis: a unique full-4K field whose frequency spectrum matches the
    banner patch (random-phase method). Same fiber character — including its
    directionality — but statistically generated, so zero tiling repetition."""
    tex = banner_texture()
    mag = np.abs(np.fft.fftshift(np.fft.fft2(tex))).astype(np.float32)
    tw = max(8, int(round(W * freq_scale)))
    th = max(8, int(round(H * freq_scale)))
    mag_big = np.asarray(
        Image.fromarray(mag, mode="F").resize((tw, th), Image.Resampling.LANCZOS),
        dtype=np.float32,
    )
    if freq_scale != 1.0:  # center-crop / pad back to canvas size
        canvas = np.zeros((H, W), np.float32)
        y0, x0 = (th - H) // 2, (tw - W) // 2
        if y0 >= 0 and x0 >= 0:
            canvas = mag_big[y0 : y0 + H, x0 : x0 + W]
        else:
            canvas[-y0 : -y0 + th, -x0 : -x0 + tw] = mag_big
        mag_big = canvas
    rng = np.random.default_rng(seed)
    phase = rng.uniform(0.0, 2.0 * np.pi, (H, W)).astype(np.float32)
    spec = np.fft.ifftshift(mag_big * np.exp(1j * phase))
    out = np.real(np.fft.ifft2(spec)).astype(np.float32)
    return out / max(float(out.std()), 1e-6)


def build_paper() -> np.ndarray:
    """4K cardstock built from the banner's own fiber texture (spectrally synthesized,
    non-repeating) + site grain accent + seeded fibers + soft lighting. Bright tone."""
    paper = np.ones((H, W, 3), np.float32) * PAPER_BASE.astype(np.float32)

    t1 = synth_banner_texture(seed=11, freq_scale=1.0)   # banner-character fibers
    t2 = synth_banner_texture(seed=23, freq_scale=0.45)  # broader undulation, same DNA
    paper += (t1 * 7.5 + t2 * 4.0)[..., None]

    grain_src = Image.open(BRAND / "paper-grain.png").convert("L")
    tile = grain_src.resize((260, 260), Image.Resampling.LANCZOS)
    ta = np.asarray(tile).astype(np.float32)
    g1 = np.tile(ta, (H // 260 + 2, W // 260 + 2))[:H, :W]
    paper += (((g1 - 127.5) / 127.5) * 5.0)[..., None]   # site-grain continuity accent

    rng = np.random.default_rng(7)
    fibers = rng.normal(0.0, 1.0, (H // 2, W // 2)).astype(np.float32)
    fibers_img = Image.fromarray(np.clip(fibers * 40 + 128, 0, 255).astype(np.uint8), "L")
    fibers_img = fibers_img.filter(ImageFilter.GaussianBlur(0.8)).resize(
        (W, H), Image.Resampling.BILINEAR
    )
    fibers_full = (np.asarray(fibers_img).astype(np.float32) - 128.0) / 40.0
    paper += fibers_full[..., None] * 3.2

    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    cx, cy = W * 0.5, H * 0.46
    r = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    r /= r.max()
    light = 1.035 - 0.105 * np.power(r, 1.8)
    paper *= light[..., None]

    return np.clip(paper, 0, 255)


def load_logo() -> Image.Image:
    return Image.open(BRAND / "market-bubble-logo-2-black.png").convert("RGBA")


def compose(t: float, paper: np.ndarray, logo: Image.Image) -> Image.Image:
    """Paper + letterpress logo at time t, as a 4K PIL image."""
    out = paper.copy()
    op = opacity_at(t)
    if op > 0.0:
        s = logo_scale_at(t)
        lw = int(round(LOGO_W_4K * s))
        lh = int(round(lw * logo.height / logo.width))
        lg = logo.resize((lw, lh), Image.Resampling.LANCZOS)
        a = np.asarray(lg)[:, :, 3].astype(np.float32) / 255.0 * op

        acan = np.zeros((H, W), np.float32)
        x0 = (W - lw) // 2
        y0 = (H - lh) // 2 - int(H * LOGO_LIFT)
        acan[y0 : y0 + lh, x0 : x0 + lw] = a

        ink_a = (acan * INK_OPACITY)[..., None]
        out = out * (1.0 - ink_a) + INK * ink_a

        sh = shadow_at(t)
        if sh > 0.0:
            # pressed-edge shadow: inner rim at the top of the depression
            inner_top = np.clip(acan - np.roll(acan, SHADOW_EDGE_PX, axis=0), 0, 1)
            inner_top = blur_map(inner_top, SHADOW_EDGE_BLUR)
            out *= (1.0 - inner_top * SHADOW_EDGE_STR * sh)[..., None]

            # light catch: paper catching light just below the deboss
            rim = np.clip(np.roll(acan, CATCH_PX, axis=0) - acan, 0, 1)
            rim = blur_map(rim, CATCH_BLUR)
            out += (rim * CATCH_STR * sh)[..., None]

            # soft contact shadow grounding the mark
            contact = blur_map(np.roll(acan, 10, axis=0), CONTACT_BLUR)
            out *= (1.0 - contact * CONTACT_STR * contact_at(t) * sh)[..., None]

    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGB")


def zoom_frame(base: Image.Image, t: float) -> Image.Image:
    """Float-precision centered crop -> 1080p Lanczos resample (sub-pixel zoom)."""
    s = 1.0 + ZOOM_MAX * smoothstep(t / T_TOTAL)
    cw, ch = W / s, H / s
    x0, y0 = (W - cw) / 2.0, (H - ch) / 2.0
    return base.resize(
        (OUT_W, OUT_H), Image.Resampling.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch)
    )


def render_stills() -> None:
    out_dir = BRAND / "_intro_preview"
    out_dir.mkdir(exist_ok=True)
    paper = build_paper()
    logo = load_logo()
    for name, t in [("still_1_paper", 0.15), ("still_2_press", 0.58), ("still_3_hold", 3.0)]:
        frame = zoom_frame(compose(t, paper, logo), t)
        frame.save(out_dir / f"{name}.png")
        print("wrote", out_dir / f"{name}.png")


def render_full() -> None:
    frames_dir = BRAND / "_intro_frames"
    if frames_dir.exists():
        shutil.rmtree(frames_dir)
    frames_dir.mkdir()

    paper = build_paper()
    logo = load_logo()

    settled: Image.Image | None = None
    for i in range(N_FRAMES):
        t = i / FPS
        if t >= T_SETTLED:
            if settled is None:
                settled = compose(t, paper, logo)
            base = settled
        else:
            base = compose(t, paper, logo)
        zoom_frame(base, t).save(frames_dir / f"f{i:03d}.png")
        if i % 10 == 0:
            print(f"frame {i}/{N_FRAMES}")

    print("encoding…")
    seq = str(frames_dir / "f%03d.png")
    subprocess.run(
        ["ffmpeg", "-y", "-framerate", str(FPS), "-i", seq, "-c:v", "libx264",
         "-crf", "19", "-preset", "slow", "-pix_fmt", "yuv420p",
         "-movflags", "+faststart", str(BRAND / "intro.mp4")],
        check=True, capture_output=True,
    )
    subprocess.run(
        ["ffmpeg", "-y", "-framerate", str(FPS), "-i", seq, "-c:v", "libvpx-vp9",
         "-b:v", "0", "-crf", "31", "-row-mt", "1", "-pix_fmt", "yuv420p",
         str(BRAND / "intro.webm")],
        check=True, capture_output=True,
    )
    Image.open(frames_dir / "f000.png").convert("RGB").save(
        BRAND / "intro-poster.jpg", quality=90
    )
    shutil.rmtree(frames_dir)
    print("done: intro.mp4, intro.webm, intro-poster.jpg")


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "stills"
    if mode == "render":
        render_full()
    else:
        render_stills()
