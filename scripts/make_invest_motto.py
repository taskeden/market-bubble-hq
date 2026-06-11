"""Crop "INVEST IN YOURSELF" out of the brand banner with the SAME treatment as
the motto images (motto-light/dark.png) so the right side of the footer is a
pixel-faithful sibling of the left: same banner serif, same ink, same paper
grain, same stroke weight — not a re-typeset lookalike.

The only wrinkle: the red "Live every Thursday" script is scrawled through the
"ST" of INVEST. We knock the red out and patch the wrecked "S" with the clean
"S" from "YOURSELF" (identical small-cap in the same crop). Deterministic.

Run: python scripts/make_invest_motto.py
"""

import numpy as np
from PIL import Image

SRC = "public/brand/Market bubble banner.png"
# Crop "INVEST IN YOURSELF" WITH the banner's curly quotes (opening "" at x1509-
# 1526, closing "" at x1869-1885 — the user wants the quotes kept, like the
# banner). Bottom sits just under the caps' baseline so most of the red script
# below is excluded by the crop itself.
BOX = (1502, 40, 1892, 82)  # left, top, right, bottom

INK_DARK = (214, 213, 219)  # pale-grey recolor for dark mode (matches motto-dark)

# Alpha knockout tuned to the motto's own weight (mean stroke alpha ~0.68): paper
# (~150) -> transparent, ink at/under OPAQUE_LUM -> opaque.
BG_LUM = 150.0
OPAQUE_LUM = 78.0
RED_TH = 42  # r-g / r-b gap above which a pixel is the vivid red script

# Patch the red-wrecked "S" of INVEST with the clean "S" of YOURSELF. Columns are
# relative to the crop (absolute banner cols shifted by the new left edge 1502):
# YOURSELF's S = abs 1791-1809; INVEST's wrecked S = abs 1608-1626.
SRC_S = (289, 307)  # 1791-1502, 1809-1502
DST_S = (106, 124)  # 1608-1502, 1626-1502


def alpha_from(crop: np.ndarray) -> np.ndarray:
    r, g, b = crop[..., 0], crop[..., 1], crop[..., 2]
    lum = r * 0.299 + g * 0.587 + b * 0.114
    a = np.clip((BG_LUM - lum) / (BG_LUM - OPAQUE_LUM), 0.0, 1.0) ** 0.85
    red = (r - g > RED_TH) & (r - b > RED_TH)
    a[red] = 0.0
    a[a < 0.04] = 0.0
    return a


def _transplant_s(a: np.ndarray, rgb: np.ndarray | None = None) -> None:
    s0, s1 = SRC_S
    d0, d1 = DST_S
    a[:, d0:d1] = a[:, s0:s1]
    if rgb is not None:
        rgb[:, d0:d1] = rgb[:, s0:s1]


def build_light() -> Image.Image:
    """Keeps the banner's real ink + grain, deepened to match motto-light exactly
    (the INVEST region of the banner prints a touch lighter than MAKE MONEY)."""
    crop = np.array(Image.open(SRC).convert("RGB").crop(BOX)).astype(float)
    a = alpha_from(crop)
    rgb = np.clip(crop * 0.28, 0, 255)  # near-solid black ink (user: darker still)
    # Scrub the faint red residue the vivid-red knockout leaves behind (sub-vivid
    # red near "IN"): neutralize any lingering warm tint to plain ink so no red
    # whisper survives. The serif ink is near-neutral, so this only hits residue.
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    reddish = (r - g > 8) & (r - b > 8)
    neutral = np.minimum(g, b)
    for c in range(3):
        rgb[..., c] = np.where(reddish, neutral, rgb[..., c])
    _transplant_s(a, rgb)
    out = np.dstack([rgb, a * 255.0]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def build_dark() -> Image.Image:
    crop = np.array(Image.open(SRC).convert("RGB").crop(BOX)).astype(float)
    a = alpha_from(crop)
    _transplant_s(a)
    h, w = a.shape
    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[..., 0], out[..., 1], out[..., 2] = INK_DARK
    out[..., 3] = (a * 255.0).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


if __name__ == "__main__":
    build_light().save("public/brand/motto-invest-light.png")
    build_dark().save("public/brand/motto-invest-dark.png")
    print("wrote motto-invest-light.png + motto-invest-dark.png", build_light().size)
