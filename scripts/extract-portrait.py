"""Cut the photographic portrait out of the hero design mockup.

The mockup in `public/references/hero-design-reference.jpg` is a full hero
composition: navbar, headline, CTAs, accent pills, ghost typography and a pink
colour grade wrapped around a real photograph. This script keeps only the
photograph.

    python scripts/extract-portrait.py

Writes `public/images/hero-clean.jpg` (flattened onto --c-bg-2) and
`public/images/hero-clean.png` (same pixels, real alpha).

WHAT IT DOES, AND WHAT IT DELIBERATELY DOES NOT
-----------------------------------------------
The subject is never generated, warped, reshaped or repainted. The pixel grid
is only cropped; an alpha matte decides what counts as background; and the
colour pass moves saturation inside two narrowly gated ranges -- the magenta
sector of the hue wheel, and pixels that are already near-white (the shirt).
Skin, features, hair shape and body proportions are the source's own.

Stages
  1. alpha      u2net_human_seg, run twice over zoomed crops and averaged.
                The full-frame pass is NOT used: at 320x320 it loses the
                right collar wing.
  2. refine     guided filter snaps the soft matte onto real image edges;
                everything outside the dilated main blob is dropped, which is
                what removes the pills, headline, swooshes and ghost type.
  3. repair     overlay chrome printed ON the subject (the pink orbit swoosh
                and "( SCROLL TO EXPLORE )", both across the jacket) is
                diffusion-inpainted, since masking cannot reach it.
  4. unmix      C = a*F + (1-a)*B solved for F along the edge band, so the
                pink backdrop stops bleeding into the hair.
  5. colour     magenta grade neutralised; white shirt rebalanced.
  6. crop       4:5 portrait, centred on the head, full shoulders kept,
                then scaled uniformly onto the 777 x 971 grid the reveal's
                viewBox is fixed to (src/animations/heroReveal.ts).

Requires numpy, pillow, scipy, onnxruntime. The ~176 MB segmentation model is
downloaded once into `scripts/.cache/`.
"""

from __future__ import annotations

import os
import urllib.request

import numpy as np
from PIL import Image
from scipy.ndimage import (
    binary_dilation,
    binary_fill_holes,
    label,
    median_filter,
    uniform_filter,
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "references", "hero-design-reference.jpg")
OUT_JPG = os.path.join(ROOT, "public", "images", "hero-clean.jpg")
OUT_PNG = os.path.join(ROOT, "public", "images", "hero-clean.png")

CACHE = os.path.join(ROOT, "scripts", ".cache")
MODEL = os.path.join(CACHE, "u2net_human_seg.onnx")
MODEL_URL = (
    "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net_human_seg.onnx"
)

BG = np.array([0x0C, 0x11, 0x1C], np.float32) / 255.0  # --c-bg-2
SEG_PASSES = [(470, 150, 1490, 1024), (520, 180, 1440, 1024)]
OVERLAYS = [(1000, 690, 1400, 900)]  # orbit swoosh + "( SCROLL TO EXPLORE )"
SHIRT_Y = 560  # below the chin: only garment and collar live here
MAGENTA = 0.85  # how hard to pull the mockup pink grade out
RATIO = 4 / 5
HEADROOM = 42
OUT_SIZE = (777, 971)  # REVEAL_VIEWBOX; the hero CSS ratio is keyed to it
JPEG_QUALITY = 90

MEAN = np.array([0.485, 0.456, 0.406], np.float32)
STD = np.array([0.229, 0.224, 0.225], np.float32)


def session():
    import onnxruntime as ort

    if not os.path.exists(MODEL):
        os.makedirs(CACHE, exist_ok=True)
        print("downloading segmentation model (~176 MB, once)...")
        urllib.request.urlretrieve(MODEL_URL, MODEL)
    opts = ort.SessionOptions()
    opts.log_severity_level = 3
    return ort.InferenceSession(MODEL, opts, providers=["CPUExecutionProvider"])


def person_mask(sess, img: Image.Image) -> np.ndarray:
    """Soft person matte, 0..1, at the image's own size."""
    x = np.asarray(img.convert("RGB").resize((320, 320), Image.LANCZOS), np.float32)
    x = (x / max(x.max(), 1.0) - MEAN) / STD
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    pred = sess.run(None, {sess.get_inputs()[0].name: x})[0][:, 0, :, :]
    lo, hi = pred.min(), pred.max()
    pred = (pred - lo) / max(hi - lo, 1e-8)
    m = Image.fromarray((pred.squeeze() * 255).astype(np.uint8), "L")
    return np.asarray(m.resize(img.size, Image.LANCZOS), np.float32) / 255.0


def boxf(x, r):
    return uniform_filter(x, size=(2 * r + 1,) * 2 + (1,) * (x.ndim - 2), mode="nearest")


def guided(guide, p, r=8, eps=1e-4):
    """Guided filter: pulls a soft matte onto the edges the image really has."""
    mg, mp = boxf(guide, r), boxf(p, r)
    a = (boxf(guide * p, r) - mg * mp) / (boxf(guide * guide, r) - mg * mg + eps)
    return boxf(a, r) * guide + boxf(mp - a * mg, r)


def largest_blob(mask):
    lab, n = label(mask)
    if n <= 1:
        return mask
    sizes = np.bincount(lab.ravel())
    sizes[0] = 0
    return lab == sizes.argmax()


def diffuse_inpaint(patch, hole, iters=600, seed=None):
    """`seed` limits the starting fill to pixels of the surface being repaired."""
    out = patch.copy()
    src = ~hole if seed is None else seed & ~hole
    out[hole] = np.nanmedian(
        np.where(src[..., None], patch, np.nan).reshape(-1, 3), axis=0
    )
    for _ in range(iters):
        out[hole] = boxf(out, 2)[hole]
    return out


def hsv(img):
    mx, mn = img.max(-1), img.min(-1)
    c = mx - mn
    cc = np.maximum(c, 1e-6)
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    h = (
        np.select(
            [c <= 1e-6, mx == r, mx == g],
            [0.0, ((g - b) / cc) % 6, (b - r) / cc + 2],
            default=(r - g) / cc + 4,
        )
        * 60.0
    )
    return h, np.where(mx > 1e-6, c / np.maximum(mx, 1e-6), 0.0), mx


def desat(img, mx, s, drop):
    """Scale saturation by (1 - drop). Hue and value are untouched."""
    scale = np.where(s > 1e-6, (s * (1 - drop)) / np.maximum(s, 1e-6), 1.0)[..., None]
    v = mx[..., None]
    return np.clip(v - (v - img) * scale, 0, 1)


def neutralise(img, strength, shirt_y):
    """Drop the mockup magenta grade, then rebalance the white shirt.

    The magenta window stops at 352 deg, short of the reds, so lips and skin
    keep their own hue. The shirt pass only touches pixels that are already
    near-white, which is what the garment is.
    """
    if strength <= 0:
        return img
    h, s, mx = hsv(img)
    w = np.clip((h - 272) / 23, 0, 1) * np.clip((352 - h) / 14, 0, 1)
    w = np.where((h > 352) | (h < 272), 0.0, w)
    out = desat(img, mx, s, strength * w)

    h2, s2, mx2 = hsv(out)
    rows = np.arange(img.shape[0])[:, None]
    shirt = (rows > shirt_y) & (mx2 > 0.80) & (s2 < 0.30)
    w2 = np.clip((mx2 - 0.80) / 0.08, 0, 1) * np.clip((0.30 - s2) / 0.08, 0, 1) * shirt
    return desat(out, mx2, s2, 0.92 * (strength / 0.85) * w2)


def main():
    src = Image.open(SRC).convert("RGB")
    W, H = src.size
    rgb = np.asarray(src, np.float32) / 255.0
    gray = rgb @ np.array([0.299, 0.587, 0.114], np.float32)
    print("source  %dx%d" % (W, H))

    # 1 + 2 -- matte
    sess = session()
    alpha = np.zeros((H, W), np.float32)
    for box in SEG_PASSES:
        x0, y0, x1, y1 = box
        alpha[y0:y1, x0:x1] += person_mask(sess, src.crop(box)) / len(SEG_PASSES)

    alpha = np.clip(guided(gray, alpha, r=6, eps=1e-4), 0, 1)
    keep = binary_dilation(binary_fill_holes(largest_blob(alpha > 0.5)), iterations=12)
    alpha = np.where(keep, alpha, 0.0)
    alpha = np.clip((alpha - 0.32) / 0.36, 0, 1)
    alpha = np.clip(guided(gray, alpha, r=2, eps=1e-5), 0, 1)

    ys, xs = np.where(alpha > 0.5)
    print("subject x[%d,%d] y[%d,%d]" % (xs.min(), xs.max(), ys.min(), ys.max()))

    # 3 -- chrome printed over the subject
    work = rgb.copy()
    for x0, y0, x1, y1 in OVERLAYS:
        sub = work[y0:y1, x0:x1]
        g = sub @ np.array([0.299, 0.587, 0.114], np.float32)
        spread = sub.max(-1) - sub.min(-1)
        # The chrome is thin, so a wide median recovers the garment under it.
        # Only the dark jacket is repaired: the shirt and the matte edge are
        # left to the unmix stage.
        surface = median_filter(g, size=15, mode="nearest")
        jacket = binary_dilation(surface < 0.30, iterations=2)
        # The swoosh carries a soft glow wider than its core; the fabric's own
        # spread stays under ~0.03, so 0.045 catches the glow and not the weave.
        hole = binary_dilation((g > surface + 0.06) | (spread > 0.045), iterations=6)
        hole &= jacket & (alpha[y0:y1, x0:x1] > 0.05)
        print("repair  %s  %d px" % ((x0, y0, x1, y1), hole.sum()))
        work[y0:y1, x0:x1] = diffuse_inpaint(sub, hole, iters=1500, seed=jacket)

    # 4 -- edge colour unmixing
    known = alpha < 0.08
    back = np.where(known[..., None], work, np.nan)
    back = np.where(np.isnan(back), np.nanmedian(back.reshape(-1, 3), axis=0), back)
    for _ in range(90):
        back = np.where(known[..., None], back, boxf(back, 4))
    a3 = alpha[..., None]
    fg = np.where(a3 > 0.02, (work - (1 - a3) * back) / np.maximum(a3, 0.02), work)
    band = (np.clip((0.97 - alpha) / 0.45, 0, 1) * (alpha > 0.02))[..., None]
    work = np.clip(work * (1 - band) + np.clip(fg, 0, 1) * band, 0, 1)

    # 5 + 6 -- colour, then crop
    work = neutralise(work, MAGENTA, SHIRT_Y)

    head = alpha[ys.min() : ys.min() + 360]
    hx = np.where(head.sum(0) > 0.5)[0]
    cx = (hx.min() + hx.max()) // 2
    top = max(0, ys.min() - HEADROOM)
    ch = H - top
    cw = int(round(ch * RATIO))
    left = int(np.clip(cx - cw // 2, 0, W - cw))
    print("crop    (%d,%d)+%dx%d  head cx=%d" % (left, top, cw, ch, cx))

    px = work[top:H, left : left + cw]
    a = alpha[top:H, left : left + cw]
    if (cw, ch) != OUT_SIZE:
        # Uniform scale only: the crop is already 4:5, so nothing stretches.
        print("scale   %dx%d -> %dx%d" % ((cw, ch) + OUT_SIZE))
        px = np.stack(
            [
                np.asarray(
                    Image.fromarray(px[..., c]).resize(OUT_SIZE, Image.LANCZOS),
                    np.float32,
                )
                for c in range(3)
            ],
            -1,
        )
        a = np.asarray(Image.fromarray(a).resize(OUT_SIZE, Image.LANCZOS), np.float32)
        px, a = np.clip(px, 0, 1), np.clip(a, 0, 1)

    Image.fromarray((np.dstack([px, a]) * 255).astype(np.uint8), "RGBA").save(
        OUT_PNG, optimize=True
    )
    flat = px * a[..., None] + BG * (1 - a[..., None])
    Image.fromarray((flat * 255).astype(np.uint8)).save(
        OUT_JPG, quality=JPEG_QUALITY, subsampling=0, optimize=True, progressive=True
    )
    for p in (OUT_JPG, OUT_PNG):
        print("wrote   %s  (%d bytes)" % (os.path.relpath(p, ROOT), os.path.getsize(p)))


if __name__ == "__main__":
    main()
