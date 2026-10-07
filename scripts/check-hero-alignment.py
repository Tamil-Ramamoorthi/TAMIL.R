"""Verify the two hero identity layers line up.

    python scripts/check-hero-alignment.py

The Phase 2 reveal moves a mask and never transforms either layer, so any
offset between hero-clean.jpg and hero-ai.jpg would show as the subject
jumping under the cursor. This measures that offset instead of assuming it.

Checks, in order:
  1. both files exist
  2. identical pixel dimensions, and the 4:5 ratio
  3. translation, by phase correlation on band-passed structure — grading
     differences cancel, geometry does not
  4. structural agreement at zero offset, as a correlation coefficient
  5. silhouette agreement, as IoU of the subject against the backdrop

Exits non-zero if anything fails, so it can gate a build.
"""

from __future__ import annotations

import os
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLEAN = os.path.join(ROOT, "public", "images", "hero-clean.jpg")
AI = os.path.join(ROOT, "public", "images", "hero-ai.jpg")

EXPECT = (777, 971)
RATIO = 4 / 5
LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)

ok = True


def check(label, passed, detail=""):
    global ok
    ok = ok and passed
    print(f"  [{'PASS' if passed else 'FAIL'}] {label}{'  ' + detail if detail else ''}")


def bandpass(g):
    """Keep edge structure, drop both grading and sensor noise."""
    return gaussian_filter(g, 1.0, mode="nearest") - gaussian_filter(g, 6.0, mode="nearest")


def phase_shift(a, b):
    """Integer (dy, dx) that best aligns b onto a."""
    A, B = np.fft.rfft2(a), np.fft.rfft2(b)
    r = A * np.conj(B)
    r /= np.maximum(np.abs(r), 1e-9)
    c = np.fft.irfft2(r, s=a.shape)
    dy, dx = np.unravel_index(np.argmax(c), c.shape)
    if dy > a.shape[0] // 2:
        dy -= a.shape[0]
    if dx > a.shape[1] // 2:
        dx -= a.shape[1]
    return int(dy), int(dx), float(c.max())


print("hero layer alignment")
print("-" * 58)

for p in (CLEAN, AI):
    if not os.path.exists(p):
        print(f"  [FAIL] missing: {os.path.relpath(p, ROOT)}")
        sys.exit(1)

ic, ia = Image.open(CLEAN), Image.open(AI)
print(f"  clean  {os.path.relpath(CLEAN, ROOT)}  {ic.size[0]}x{ic.size[1]}  {ic.mode}  "
      f"{os.path.getsize(CLEAN)} B")
print(f"  ai     {os.path.relpath(AI, ROOT)}  {ia.size[0]}x{ia.size[1]}  {ia.mode}  "
      f"{os.path.getsize(AI)} B")
print()

check("both files exist", True)
check("clean is 777x971", ic.size == EXPECT, str(ic.size))
check("ai is 777x971", ia.size == EXPECT, str(ia.size))
check("dimensions identical", ic.size == ia.size)
check("aspect ratio 4:5", abs(ic.size[0] / ic.size[1] - RATIO) < 0.001,
      f"{ic.size[0] / ic.size[1]:.4f}")

gc = np.asarray(ic.convert("RGB"), np.float32) @ LUMA / 255
ga = np.asarray(ia.convert("RGB"), np.float32) @ LUMA / 255
bc, ba = bandpass(gc), bandpass(ga)

dy, dx, peak = phase_shift(bc, ba)
check("translation is zero", (dy, dx) == (0, 0), f"dy={dy} dx={dx}, peak {peak:.4f}")

num = float((bc * ba).sum())
den = float(np.sqrt((bc**2).sum() * (ba**2).sum()))
corr = num / max(den, 1e-9)
check("structure correlates at zero offset", corr > 0.80, f"r = {corr:.4f}")

# Silhouette: threshold above the backdrop graphics so this measures the body,
# not the circuit traces, which exist only in the AI layer.
sc, sa = gc > 0.34, ga > 0.34
inter, union = (sc & sa).sum(), (sc | sa).sum()
iou = inter / max(union, 1)
check("silhouette IoU", iou > 0.97, f"{iou:.4f}")

# Where the subject actually sits, per image.
for name, m in (("clean", sc), ("ai", sa)):
    ys, xs = np.where(m)
    print(f"         {name} subject bbox  x[{xs.min()},{xs.max()}]  y[{ys.min()},{ys.max()}]")

print("-" * 58)
print("ALIGNED" if ok else "MISALIGNED")
sys.exit(0 if ok else 1)
