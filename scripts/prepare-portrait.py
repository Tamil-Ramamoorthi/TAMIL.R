"""Build the hero portrait from the original studio photograph.

    python scripts/prepare-portrait.py

Reads  scripts/source/hero-portrait.jpg   (3072 x 2048 original, white backdrop)
Writes public/images/hero-clean.jpg       (777 x 971, flattened onto --c-bg-2)
       public/images/hero-clean.png       (same pixels, real alpha)

`scripts/make-hero-ai.py` then derives hero-ai.jpg from hero-clean.png.

This replaces `scripts/extract-portrait.py` as the producer of the hero plate.
That script cut a portrait OUT of a design mockup and had to repair overlay
chrome; this source is a clean photograph, so none of that applies.

WHAT IT DOES, AND WHAT IT DELIBERATELY DOES NOT
-----------------------------------------------
The subject is never generated, warped, reshaped or repainted. The pixel grid
is cropped and scaled uniformly; an alpha matte decides what is backdrop; and
the finish is tone and acuity only. Face, hair, clothing and pose are the
photograph's own.

Stages
  1. matte      u2net_human_seg for the coarse subject (a body pass plus a
                head pass for the hair), then an exact white-backdrop matte in
                the edge band: with the backdrop known to be pure white, each
                edge pixel's alpha is its projection onto the line between
                white and the nearby solid-subject colour. Hair strands come
                out as real partial coverage instead of a hard cut.
  2. unmix      F = B + (C - B) / a with B = white, so no white halo survives
                when the subject goes onto the dark hero panel.
  3. crop       4:5, the same 48 px (of 971) headroom as the previous plate,
                centred on the head, running to the photograph's bottom edge.
  4. scale      premultiplied Lanczos down to 777 x 971 (~2x supersampling,
                so the plate keeps the source's native detail).
  5. finish     chroma-only denoise, a gentle luminance S-curve, restrained
                luminance-only sharpening, eased on skin, kept off the edge.

Requires numpy, pillow, scipy, onnxruntime. The segmentation model is shared
with extract-portrait.py and cached in `scripts/.cache/`.
"""

from __future__ import annotations

import os
import urllib.request

import numpy as np
from PIL import Image, ImageOps
from scipy.ndimage import (
    binary_dilation,
    binary_erosion,
    binary_fill_holes,
    distance_transform_edt,
    gaussian_filter,
    label,
    uniform_filter,
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "scripts", "source", "hero-portrait.jpg")
OUT_JPG = os.path.join(ROOT, "public", "images", "hero-clean.jpg")
OUT_PNG = os.path.join(ROOT, "public", "images", "hero-clean.png")

CACHE = os.path.join(ROOT, "scripts", ".cache")
MODEL = os.path.join(CACHE, "u2net_human_seg.onnx")
MODEL_URL = (
    "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net_human_seg.onnx"
)

BG = np.array([0x0C, 0x11, 0x1C], np.float32) / 255.0  # --c-bg-2
WHITE = np.ones(3, np.float32)  # the studio backdrop, measured at 1.0 in every corner
OUT_SIZE = (777, 971)  # REVEAL_VIEWBOX; the hero CSS ratio is keyed to it
RATIO = 4 / 5
HEADROOM = 48 / 971  # as a fraction of plate height, matching the previous plate
JPEG_QUALITY = 95

MEAN = np.array([0.485, 0.456, 0.406], np.float32)
STD = np.array([0.229, 0.224, 0.225], np.float32)
LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)


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


def luma(x):
    return x @ LUMA


def gauss(x, s):
    return gaussian_filter(x, sigma=(s, s) + (0,) * (x.ndim - 2), mode="nearest")


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


def propagate(img, known, scales=(3.0, 6.0, 12.0, 24.0)):
    """Push the colour of `known` pixels outward, nearest scale first."""
    out = img.copy()
    filled = known.copy()
    k = known.astype(np.float32)
    for s in scales:
        w = gauss(k, s)
        prop = gauss(img * k[..., None], s) / np.maximum(w, 1e-6)[..., None]
        take = ~filled & (w > 1e-3)
        out[take] = prop[take]
        filled |= take
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


def skin(img):
    """Soft warm-skin mask, only used to ease sharpening on the face."""
    h, s, mx = hsv(img)
    w = (
        np.clip((h - 2) / 8, 0, 1)
        * np.clip((52 - h) / 14, 0, 1)
        * np.clip((s - 0.14) / 0.10, 0, 1)
        * np.clip((0.80 - s) / 0.16, 0, 1)
        * np.clip((mx - 0.10) / 0.10, 0, 1)
    )
    return gaussian_filter(w, 3.0, mode="nearest")


# ------------------------------------------------------------------ matte ---
def matte(sess, src: Image.Image, rgb: np.ndarray) -> np.ndarray:
    W, H = src.size
    coarse = np.zeros((H, W), np.float32)
    weight = np.zeros((H, W), np.float32)
    for box, wgt in (((560, 80, 2760, H), 1.0), ((560, 0, 2760, H), 1.0)):
        x0, y0, x1, y1 = box
        coarse[y0:y1, x0:x1] += person_mask(sess, src.crop(box)) * wgt
        weight[y0:y1, x0:x1] += wgt
    coarse = coarse / np.maximum(weight, 1e-6)

    # A tighter pass over the head resolves the hair outline far better than
    # the body pass can at 320 x 320; it takes over wherever it is defined.
    body = largest_blob(coarse > 0.5)
    ys, xs = np.where(body)
    top = ys.min()
    head_rows = body[top : top + 700]
    hx = np.where(head_rows.any(0))[0]
    hb = (
        max(0, hx.min() - 160),
        max(0, top - 160),
        min(W, hx.max() + 160),
        min(H, top + 1100),
    )
    head = person_mask(sess, src.crop(hb))
    feather = np.ones_like(head)
    ramp = 80
    lin = np.minimum(np.arange(head.shape[0]), np.arange(head.shape[0])[::-1])[:, None]
    feather *= np.clip(lin / ramp, 0, 1)
    lin = np.minimum(np.arange(head.shape[1]), np.arange(head.shape[1])[::-1])[None, :]
    feather *= np.clip(lin / ramp, 0, 1)
    x0, y0, x1, y1 = hb
    coarse[y0:y1, x0:x1] = coarse[y0:y1, x0:x1] * (1 - feather) + head * feather
    print("head    box %s" % (hb,))

    solid = binary_fill_holes(largest_blob(coarse > 0.5))
    depth = distance_transform_edt(solid)
    whiteness = np.clip((rgb.min(-1) - 0.90) / 0.07, 0, 1)

    # Solid-subject colour, taken only from pixels that are not backdrop-white,
    # so a gap between strands cannot vouch for itself.
    sure_fg = binary_erosion(solid, iterations=14) & (whiteness < 0.3)
    band = binary_dilation(solid, iterations=28)

    F = propagate(rgb, sure_fg)
    d = F - WHITE
    a_est = ((rgb - WHITE) * d).sum(-1) / np.maximum((d * d).sum(-1), 1e-4)
    a_est = np.clip(a_est, 0, 1)
    # Low contrast against the backdrop (a near-white subject colour) makes the
    # projection ill-conditioned; fall back to the network there.
    sep = np.clip((np.sqrt((d * d).sum(-1)) - 0.15) / 0.20, 0, 1)
    a_est = a_est * sep + coarse * (1 - sep)

    # Inside the subject is opaque whatever its colour (lit skin, the white
    # shirt, hair speculars) -- except backdrop-white within the outer ~45 px,
    # which is the backdrop seen between strands at the hair outline.
    inner = np.clip((depth - 4) / 8, 0, 1) * (1 - whiteness) + np.clip(
        (depth - 45) / 15, 0, 1
    ) * whiteness
    alpha = np.where(band, np.maximum(a_est, inner), 0.0)

    # The projection carries JPEG noise straight into the matte: settle it on
    # the image's own edges, then trim what is left of the backdrop.
    alpha = np.clip(guided(luma(rgb), alpha, r=2, eps=2e-4), 0, 1)
    # Smoothing must not hand coverage back to pixels the backdrop test has
    # already called white: cap the band at the exact estimate (plus a hair
    # of slack for noise).
    cap = np.where(band, np.maximum(a_est, inner) + 0.03, 0.0)
    alpha = np.minimum(alpha, cap)
    alpha = np.clip((alpha - 0.04) / 0.94, 0, 1)
    keep = binary_dilation(largest_blob(alpha > 0.5), iterations=30)
    return np.where(keep, alpha, 0.0).astype(np.float32), F


# ----------------------------------------------------------------- finish ---
def finish(px, a, skin_mask):
    """Polish at output size. Colour stays where it is; only tone and acuity."""
    L = luma(px)

    # chroma denoise: residual compression blotches live in colour
    chroma = px - L[..., None]
    chroma = chroma * 0.5 + gauss(chroma, 0.9) * 0.5
    px = np.clip(L[..., None] + chroma, 0, 1)

    # gentle S on luminance with a small toe, so the hair keeps its strands;
    # a ratio above ~0.08 luma, neutral below, where a ratio would dye
    # near-black pixels with whichever channel survives.
    s = L * L * (3 - 2 * L)
    L2 = L + 0.12 * (s - L) + 0.014 * (1 - L) ** 6
    ratio = px * (L2 / np.maximum(L, 1e-4))[..., None]
    shift = px + (L2 - L)[..., None]
    t = np.clip((L - 0.04) / 0.08, 0, 1)[..., None]
    px = np.clip(ratio * t + shift * (1 - t), 0, 1)

    # acuity, luminance only; skin gets about half, the matte edge none
    Lp = luma(px)
    fine = Lp - gaussian_filter(Lp, 0.8, mode="nearest")
    fine = np.sign(fine) * np.clip(np.abs(fine) - 0.003, 0, None)
    mid = Lp - gaussian_filter(Lp, 3.5, mode="nearest")
    core = gaussian_filter((a > 0.97).astype(np.float32), 1.5, mode="nearest")
    core = np.clip((core - 0.5) * 2, 0, 1)
    gain = core * (1 - 0.5 * skin_mask)
    return np.clip(px + ((0.40 * fine + 0.08 * mid) * gain)[..., None], 0, 1)


def resize(x, size):
    chans = x[..., None] if x.ndim == 2 else x
    out = np.stack(
        [
            np.asarray(Image.fromarray(chans[..., c]).resize(size, Image.LANCZOS), np.float32)
            for c in range(chans.shape[-1])
        ],
        -1,
    )
    return out[..., 0] if x.ndim == 2 else out


def main():
    src = ImageOps.exif_transpose(Image.open(SRC)).convert("RGB")
    W, H = src.size
    rgb = np.asarray(src, np.float32) / 255.0
    print("source  %dx%d" % (W, H))

    # 1 -- matte
    alpha, F = matte(session(), src, rgb)
    ys, xs = np.where(alpha > 0.5)
    print("subject x[%d,%d] y[%d,%d]" % (xs.min(), xs.max(), ys.min(), ys.max()))

    # 2 -- unmix the white backdrop out of the edge
    a3 = alpha[..., None]
    fg = WHITE + (rgb - WHITE) / np.maximum(a3, 1e-3)
    trust = np.clip((a3 - 0.08) / 0.25, 0, 1)  # thin coverage: lean on F
    fg = np.clip(fg, 0, 1) * trust + F * (1 - trust)
    edge = np.clip((0.995 - a3) / 0.30, 0, 1)
    fg = rgb * (1 - edge) + fg * edge

    # 3 -- crop
    head = alpha[ys.min() : ys.min() + 600] > 0.5
    hx = np.where(head.any(0))[0]
    cx = (hx.min() + hx.max()) // 2
    ch = int(round((H - ys.min()) / (1 - HEADROOM)))
    ch = min(ch, H)
    top = H - ch
    cw = int(round(ch * RATIO))
    left = int(np.clip(cx - cw // 2, 0, W - cw))
    print("crop    (%d,%d)+%dx%d  head cx=%d" % (left, top, cw, ch, cx))
    px = fg[top:H, left : left + cw]
    a = alpha[top:H, left : left + cw]

    # 4 -- scale, premultiplied so no backdrop colour leaks back into the edge
    pre = resize(px * a[..., None], OUT_SIZE)
    a = np.clip(resize(a, OUT_SIZE), 0, 1)
    px = np.where(a[..., None] > 1e-3, pre / np.maximum(a[..., None], 1e-3), 0)
    px = np.clip(px, 0, 1)
    print("scale   %dx%d -> %dx%d" % ((cw, ch) + OUT_SIZE))

    # 5 -- finish
    px = finish(px, a, skin(px))

    Image.fromarray((np.dstack([px, a]) * 255 + 0.5).astype(np.uint8), "RGBA").save(
        OUT_PNG, optimize=True
    )
    flat = px * a[..., None] + BG * (1 - a[..., None])
    Image.fromarray((flat * 255 + 0.5).astype(np.uint8)).save(
        OUT_JPG, quality=JPEG_QUALITY, subsampling=0, optimize=True, progressive=True
    )
    for p in (OUT_JPG, OUT_PNG):
        print("wrote   %s  (%d bytes)" % (os.path.relpath(p, ROOT), os.path.getsize(p)))


if __name__ == "__main__":
    main()
