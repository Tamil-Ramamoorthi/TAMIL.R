"""Build the futuristic AI counterpart of the hero portrait.

    python scripts/make-hero-ai.py

Reads  public/images/hero-clean.png  (the Phase 2A portrait, with its matte)
Writes public/images/hero-ai.jpg     (777 x 971, same encoder settings)

WHY THIS IS A DERIVATION, NOT A GENERATION
------------------------------------------
The Phase 2 reveal moves a mask and nothing else, so the two hero images have
to agree pixel for pixel. A generated render cannot do that: it would place a
different face at different coordinates. So this script never synthesises a
person. It starts from the exact same photograph and applies only:

  * colour     — a split-tone cool grade, luminance-preserving
  * light      — a cyan rim derived from the subject's own alpha edge
  * detail     — iso-luminance contours, as a faint 3D-scan overlay
  * atmosphere — a new deep-navy background with glow, traces and grid
  * finish     — bloom, scanlines, vignette, a gentle S-curve

Every one of those is a per-pixel colour operation or an additive layer. There
is no resize, crop, rotation, translation or warp anywhere in the pipeline, so
the face, hair, shoulders, shirt and pose land on exactly the coordinates they
occupy in hero-clean.jpg. That is guaranteed by construction, and
`scripts/check-hero-alignment.py` measures it afterwards.

Requires numpy, pillow, scipy. No new project dependencies.
"""

from __future__ import annotations

import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import (
    binary_closing,
    binary_dilation,
    binary_fill_holes,
    gaussian_filter,
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "images", "hero-clean.png")
OUT = os.path.join(ROOT, "public", "images", "hero-ai.jpg")

JPEG_QUALITY = 93  # matches hero-clean.jpg
SEED = 20251003

# Palette, straight off the design tokens in src/styles/tokens.css
C_BG = np.array([0x05, 0x07, 0x0D], np.float32) / 255  # --c-bg
C_BG3 = np.array([0x11, 0x18, 0x26], np.float32) / 255  # --c-bg-3
ACCENT = np.array([0x2E, 0x6C, 0xF6], np.float32) / 255  # --c-accent
ACCENT_HI = np.array([0x4D, 0x84, 0xFF], np.float32) / 255  # --c-accent-bright
CYAN = np.array([0.42, 0.86, 1.00], np.float32)
# Per-channel GAINS for the grade, by tonal range. Low red in the shadows
# keeps the hair's residual warm cast from turning purple under the blue.
SHADOW_GAIN = np.array([0.80, 0.94, 1.24], np.float32)
MID_GAIN = np.array([0.94, 1.00, 1.11], np.float32)
HIGH_GAIN = np.array([0.97, 0.99, 1.04], np.float32)
# Multiplicative tint for the shirt — preserves fold shading.
GARMENT = np.array([0.88, 0.96, 1.05], np.float32)

LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)


def luma(x):
    return x @ LUMA


def blur(x, s):
    return gaussian_filter(x, sigma=(s, s) + (0,) * (x.ndim - 2), mode="nearest")


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def screen(a, b):
    return 1 - (1 - a) * (1 - b)


# ---------------------------------------------------------------- subject ---
def garment_weight(rgb, alpha):
    """The white shirt: bright, desaturated, inside the matte — and not skin.

    The skin subtraction matters. A specular on the cheek or the bridge of
    the nose is also bright and desaturated, so "bright + flat" alone scores
    it as fabric at ~0.8 and the garment overlay lands on the face.
    """
    mx = rgb.max(-1)
    sat = np.where(mx > 1e-6, (mx - rgb.min(-1)) / np.maximum(mx, 1e-6), 0)
    w = smoothstep(0.62, 0.86, mx) * (1 - smoothstep(0.16, 0.34, sat)) * alpha
    w *= 1 - skin_weight(rgb)
    return gaussian_filter(w, 2.5, mode="nearest")


def grade(rgb, alpha):
    """Split-tone cool grade that keeps the original luminance.

    Shadows go deep blue, midtones lean cyan, highlights stay almost neutral
    so skin still reads as skin. Luminance is restored at the end, which is
    what stops the face from turning into a blue silhouette.

    Two corrections sit on top of that. Deep shadows get their red pulled
    down before the blue goes on, otherwise the hair's residual warm cast
    plus blue lands on purple. And the white shirt, which would otherwise
    blow out and flatten, is compressed and cooled so it reads as a lit
    garment in a dark room rather than a white shape.
    """
    L = luma(rgb)[..., None]
    shadow = (1 - L) ** 2
    mid = 4 * L * (1 - L)
    high = L**3

    # The tint is MULTIPLICATIVE. An additive offset drives the dark channels
    # of the hair below zero, they clip, and the luminance restore below then
    # amplifies the one surviving channel ~5x — which dyes the hair electric
    # blue. A gain per channel cannot clip, so the hair just goes cool.
    out = rgb * (
        1
        + shadow * (SHADOW_GAIN - 1)
        + mid * (MID_GAIN - 1)
        + high * (HIGH_GAIN - 1)
    )
    out = np.clip(out, 0, 1)

    # restore luminance (98%, so it sits a touch deeper than the clean plate),
    # with the correction clamped so it can never run away on a dark pixel
    new_L = luma(out)[..., None]
    out *= np.clip(np.divide(L * 0.98, np.maximum(new_L, 1e-4)), 0.6, 1.5)
    out = np.clip(out, 0, 1)

    # hold the highlights back so nothing clips to paper white
    Lb = luma(out)[..., None]
    out *= 1 - 0.14 * smoothstep(0.74, 1.0, Lb)

    # Cool the garment by MULTIPLYING, never by adding: a flat additive tint
    # erases the fold shading and leaves a paper cut-out. Then put the local
    # contrast back, so the fabric still reads as fabric under the grade.
    g = garment_weight(rgb, alpha)[..., None]
    out *= 1 - g * (1 - GARMENT)
    detail = out - blur(out, 9.0)
    out = np.clip(out + detail * g * 0.55, 0, 1)
    return np.clip(out, 0, 1)


def skin_weight(rgb):
    """Rough warm-skin mask, used to hold overlays back off the face."""
    mx, mn = rgb.max(-1), rgb.min(-1)
    c = mx - mn
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.select(
        [c <= 1e-6, mx == r, mx == g],
        [0.0, ((g - b) / np.maximum(c, 1e-6)) % 6, (b - r) / np.maximum(c, 1e-6) + 2],
        default=(r - g) / np.maximum(c, 1e-6) + 4,
    ) * 60.0
    s = np.where(mx > 1e-6, c / np.maximum(mx, 1e-6), 0)
    w = smoothstep(2, 10, h) * (1 - smoothstep(38, 52, h))
    w *= smoothstep(0.14, 0.24, s) * (1 - smoothstep(0.62, 0.78, s))
    w *= smoothstep(0.10, 0.20, mx)

    # Close it into a solid region. Raw per-pixel skin detection is full of
    # holes — speculars on the cheek and nose, the lips, the brows — and an
    # overlay gated on the raw mask pours straight through those gaps and
    # lands on the face as a coloured blotch. Fill, close, dilate, feather.
    solid = binary_fill_holes(w > 0.25)
    solid = binary_closing(solid, iterations=9)
    solid = binary_dilation(solid, iterations=5)
    return gaussian_filter(solid.astype(np.float32), 5, mode="nearest")


def contours(rgb, alpha, bands=40):
    """Iso-luminance contour lines — a quiet 3D scan across the garment.

    Confined to the shirt. Gating this on "not skin" was not enough: skin
    detection fails at the temples, the hairline and on speculars, and the
    overlay pours through those gaps as a cyan blotch on the face. Fabric is
    a positive mask with none of that failure mode, and it is where the
    effect reads best anyway. Skin gets `micro_detail`, which has no colour.
    """
    L = gaussian_filter(luma(rgb), 2.0, mode="nearest")
    s = L * bands
    d = np.abs(s - np.round(s))
    line = np.exp(-((d / 0.05) ** 2))

    # only where the surface actually turns, so flat areas stay clean
    gy, gx = np.gradient(L)
    slope = smoothstep(0.004, 0.030, np.hypot(gx, gy))

    # Luminance window. Screening cyan onto near-black hair is a huge relative
    # jump and dyes it electric blue, so the darks are gated out and the
    # overlay lives on mid-tones and fabric, where it reads as a scan.
    window = smoothstep(0.16, 0.40, L) * (1 - smoothstep(0.86, 0.99, L))

    w = line * slope * window * alpha * garment_weight(rgb, alpha)
    return gaussian_filter(w, 0.5, mode="nearest")


def micro_detail(rgb, alpha):
    """High-frequency lift on skin: 'enhanced', without tinting or blotching."""
    fine = luma(rgb) - gaussian_filter(luma(rgb), 2.4, mode="nearest")
    return fine * skin_weight(rgb) * alpha


def rim(alpha):
    """Cyan edge light, built from the matte so it can only ever hug the body.

    Weighted to the viewer's right, matching the key direction already in the
    photograph, with a weaker fill on the left and a little lift on top.
    """
    inner = np.clip(alpha * (1 - blur(alpha, 9.0)), 0, 1)
    gy, gx = np.gradient(gaussian_filter(alpha, 2.0, mode="nearest"))
    n = np.hypot(gx, gy) + 1e-6
    nx, ny = -gx / n, -gy / n  # outward normal

    side = 0.74 * np.clip(nx, 0, 1) + 0.40 * np.clip(-nx, 0, 1)
    top = 0.34 * np.clip(-ny, 0, 1)
    return np.clip(inner * (side + top) * 1.7, 0, 1)


# ------------------------------------------------------------- background ---
def traces(h, w, keepout):
    """Sparse circuit routing, drawn only where the subject is not."""
    rng = np.random.default_rng(SEED)
    img = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(img)
    step = 26

    for _ in range(34):
        x, y = int(rng.integers(0, w)), int(rng.integers(0, h))
        dx, dy = rng.choice([(1, 0), (0, 1), (1, 1), (1, -1)])
        pts = [(x, y)]
        for _ in range(int(rng.integers(3, 8))):
            run = int(rng.integers(1, 4)) * step
            x, y = x + dx * run, y + dy * run
            pts.append((x, y))
            if rng.random() < 0.5:  # 90 deg turn, or diagonal jog
                dx, dy = (0, 1 if rng.random() < 0.5 else -1) if dx else (1, 0)
            elif rng.random() < 0.3:
                dx, dy = (1, 1) if rng.random() < 0.5 else (1, -1)
        d.line(pts, fill=150, width=1)
        for px, py in pts[1:-1]:
            if rng.random() < 0.3:
                d.rectangle([px - 2, py - 2, px + 2, py + 2], outline=210)
        if rng.random() < 0.55:
            px, py = pts[-1]
            d.ellipse([px - 3, py - 3, px + 3, py + 3], outline=230)

    t = np.asarray(img.filter(ImageFilter.GaussianBlur(0.4)), np.float32) / 255
    return t * keepout


def background(h, w, alpha):
    """Deep-navy technological atmosphere behind the subject."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    nx, ny = xx / w, yy / h

    # pool of light behind the head, falling off to near-black in the corners
    r = np.hypot((nx - 0.50) / 0.95, (ny - 0.30) / 1.05)
    base = C_BG + (C_BG3 - C_BG) * (1 - smoothstep(0.10, 1.05, r))[..., None]

    # keep every graphic clear of the body, and fade it in with distance
    keepout = smoothstep(0.05, 0.55, 1 - blur(alpha, 13.0))

    grid = ((np.abs((xx % 52) - 0) < 1) | (np.abs((yy % 52) - 0) < 1)).astype(np.float32)
    base += (grid * keepout * 0.035)[..., None] * ACCENT

    base += (traces(h, w, keepout) * 0.30)[..., None] * ACCENT_HI

    # the subject's own glow, thrown onto the atmosphere
    halo = blur(alpha, 26.0) * (1 - alpha)
    base = screen(base, (halo * 0.15)[..., None] * ACCENT)
    tight = blur(alpha, 6.0) * (1 - alpha)
    base = screen(base, (tight * 0.10)[..., None] * CYAN)

    return np.clip(base, 0, 1)


# ------------------------------------------------------------------ finish ---
def finish(img):
    L = luma(img)
    hi = smoothstep(0.76, 1.0, L)
    bloom = blur(hi[..., None] * img, 20.0)
    img = screen(img, bloom * 0.13 * (0.35 + 0.65 * CYAN))

    h, w = img.shape[:2]
    yy = np.arange(h, dtype=np.float32)[:, None, None]
    img *= 1 + 0.016 * np.sin(yy * np.pi)  # scanlines

    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    v = np.hypot((xx / w - 0.5) / 0.72, (yy / h - 0.5) / 0.80)
    img *= (1 - 0.30 * smoothstep(0.55, 1.35, v))[..., None]

    img = np.clip(img, 0, 1)
    return np.clip(img + 0.09 * (img - blur(img, 1.1)), 0, 1)  # gentle crispen


def main():
    src = Image.open(SRC)
    if src.mode != "RGBA":
        raise SystemExit(f"expected RGBA, got {src.mode}")
    w, h = src.size
    a = np.asarray(src, np.float32) / 255
    rgb, alpha = a[..., :3], a[..., 3]
    print(f"source  {w}x{h}  ratio {w / h:.4f}")

    fg = grade(rgb, alpha)
    fg = screen(fg, contours(rgb, alpha)[..., None] * 0.30 * CYAN)
    fg = np.clip(fg + micro_detail(rgb, alpha)[..., None] * 0.22, 0, 1)
    fg = screen(fg, rim(alpha)[..., None] * 0.42 * CYAN)

    out = fg * alpha[..., None] + background(h, w, alpha) * (1 - alpha[..., None])
    out = finish(out)

    img = Image.fromarray((out * 255 + 0.5).astype(np.uint8), "RGB")
    if img.size != (w, h):
        raise SystemExit("pipeline changed the pixel dimensions")
    img.save(OUT, quality=JPEG_QUALITY, subsampling=0, optimize=True, progressive=True)
    print(f"wrote   {os.path.relpath(OUT, ROOT)}  {img.size[0]}x{img.size[1]}  "
          f"({os.path.getsize(OUT)} bytes)")


if __name__ == "__main__":
    main()
