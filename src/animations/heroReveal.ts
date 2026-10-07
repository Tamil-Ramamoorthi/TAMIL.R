/**
 * HERO REVEAL
 * ===========
 * The organic cursor reveal of the futuristic identity.
 *
 * Two portraits sit in one frame. The clean photograph is the base layer; the
 * AI treatment is an SVG `<image>` above it, masked by a single `<path>`. The
 * pointer never moves either picture — it only reshapes that path. That is
 * the whole trick, and it is why the two layers can never drift apart.
 *
 * WHY IT IS NOT A SPOTLIGHT
 * -------------------------
 * The mask is a closed Catmull-Rom spline through 11 control points, each
 * with its own fixed radial bias and its own slow sine, so the outline is
 * asymmetric standing still and never repeats exactly. Pointer velocity
 * stretches it along the direction of travel and squashes it across, which is
 * what sells "something was dragged through a liquid". An SVG filter then
 * warps the whole outline through fractal noise and feathers it, so the
 * boundary is irregular at two scales and has no hard edge anywhere.
 *
 * COST
 * ----
 * Per frame: one `getBoundingClientRect` (cached via ResizeObserver, not read
 * in the loop), eleven points of trigonometry and one `setAttribute`. No
 * React state, no re-render, no layout. Idle frames bail out before building
 * the path. The loop rides `gsap.ticker`, so it shares the one rAF the rest
 * of the site already runs on.
 */

import { getLocalPointer, getPointer } from "../hooks/pointerStore";
import { clamp, damp } from "./math";
import { gsap, motionEnabled } from "./gsapSetup";

/** The asset's native pixel grid, and the SVG's viewBox. */
export const REVEAL_VIEWBOX = { w: 777, h: 971 } as const;

const TAU = Math.PI * 2;
/**
 * 14 points, not 11. Spatial detail from the spline is free — it is a little
 * trigonometry — whereas detail from the SVG filter is rasterisation work on
 * every frame. Carrying more of the irregularity here lets the filter stay
 * cheap. Neighbouring biases deliberately alternate sign so the extra points
 * produce lobes rather than just a rounder curve.
 */
const POINTS = 14;

/**
 * Per-control-point character. `bias` is a permanent radial offset — this is
 * what makes the blob asymmetric even when nothing is moving. `amp`/`freq`/
 * `phase` drive the slow morph. Hand-picked rather than random so the shape
 * is deterministic and reviewable.
 */
const SHAPE: readonly { bias: number; amp: number; freq: number; phase: number }[] = [
  { bias: 0.16, amp: 0.075, freq: 0.19, phase: 0.0 },
  { bias: -0.12, amp: 0.055, freq: 0.27, phase: 1.1 },
  { bias: 0.21, amp: 0.09, freq: 0.15, phase: 2.4 },
  { bias: -0.06, amp: 0.065, freq: 0.31, phase: 3.9 },
  { bias: 0.09, amp: 0.08, freq: 0.21, phase: 0.6 },
  { bias: -0.17, amp: 0.05, freq: 0.35, phase: 5.2 },
  { bias: 0.24, amp: 0.085, freq: 0.17, phase: 2.0 },
  { bias: -0.04, amp: 0.07, freq: 0.29, phase: 4.4 },
  { bias: 0.13, amp: 0.06, freq: 0.23, phase: 1.7 },
  { bias: -0.14, amp: 0.078, freq: 0.13, phase: 3.1 },
  { bias: 0.19, amp: 0.052, freq: 0.33, phase: 5.8 },
  { bias: -0.09, amp: 0.068, freq: 0.25, phase: 0.9 },
  { bias: 0.11, amp: 0.045, freq: 0.37, phase: 4.0 },
  { bias: -0.18, amp: 0.082, freq: 0.11, phase: 2.7 },
];

/** Overall extent lands in the 250-400px band the brief asks for. */
const RADIUS_RATIO = 0.42;
const RADIUS_MIN = 112;
const RADIUS_MAX = 192;

const FOLLOW = 9.5; // inertia: high enough to feel attached, low enough to trail
const GROW = 5.5; // entry / exit
const VEL_SMOOTH = 7;
const STRETCH_MAX = 0.34;

export interface HeroRevealElements {
  /** The portrait frame. Defines the interaction area and the scale. */
  frame: HTMLElement;
  /** The `<path>` inside the SVG `<mask>`. */
  path: SVGPathElement;
}

/**
 * Wires the reveal up. Returns a cleanup function.
 *
 * Under reduced motion the blob still reveals, but without inertia, morph or
 * velocity stretch — it is a plain soft shape that tracks the pointer and
 * cross-fades. Content is never gated on motion.
 */
export function initHeroReveal({ frame, path }: HeroRevealElements): () => void {
  const reduced = !motionEnabled();

  const { w: VW, h: VH } = REVEAL_VIEWBOX;

  // Cached frame width, so the loop never reads layout.
  let cssWidth = frame.getBoundingClientRect().width || 1;
  const observer = new ResizeObserver((entries) => {
    const box = entries[0]?.contentRect;
    if (box && box.width > 0) cssWidth = box.width;
  });
  observer.observe(frame);

  // A touch has no hover, so the reveal is bound to the press instead.
  let touchDown = false;
  const onDown = (event: PointerEvent) => {
    if (event.pointerType === "touch") touchDown = true;
  };
  const onUp = () => {
    touchDown = false;
  };
  // Passive, and never preventDefault — vertical scrolling stays native.
  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("pointerup", onUp, { passive: true });
  window.addEventListener("pointercancel", onUp, { passive: true });
  window.addEventListener("touchend", onUp, { passive: true });
  window.addEventListener("touchcancel", onUp, { passive: true });

  // State, all in closure — nothing here ever reaches React.
  let cx = VW * 0.5;
  let cy = VH * 0.5;
  let strength = 0;
  let prevX = cx;
  let prevY = cy;
  let velX = 0;
  let velY = 0;
  let settled = false; // true once a fully-hidden frame has been written

  const xs = new Float32Array(POINTS);
  const ys = new Float32Array(POINTS);

  function buildPath(): string {
    let d = `M${xs[0]!.toFixed(1)},${ys[0]!.toFixed(1)}`;
    for (let i = 0; i < POINTS; i += 1) {
      const p0x = xs[(i - 1 + POINTS) % POINTS]!;
      const p0y = ys[(i - 1 + POINTS) % POINTS]!;
      const p1x = xs[i]!;
      const p1y = ys[i]!;
      const p2x = xs[(i + 1) % POINTS]!;
      const p2y = ys[(i + 1) % POINTS]!;
      const p3x = xs[(i + 2) % POINTS]!;
      const p3y = ys[(i + 2) % POINTS]!;

      // Catmull-Rom -> cubic Bezier. Keeps the outline smooth and closed.
      const c1x = p1x + (p2x - p0x) / 6;
      const c1y = p1y + (p2y - p0y) / 6;
      const c2x = p2x - (p3x - p1x) / 6;
      const c2y = p2y - (p3y - p1y) / 6;
      d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(
        1,
      )} ${p2x.toFixed(1)},${p2y.toFixed(1)}`;
    }
    return `${d}Z`;
  }

  function tick(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs, 50) / 1000;

    const local = getLocalPointer(frame);
    const pointer = getPointer();
    const over = local.over && (!pointer.isTouch || touchDown);

    // Target centre, in the asset's own pixel grid.
    const tx = local.u * VW;
    const ty = local.v * VH;

    if (reduced) {
      cx = tx;
      cy = ty;
    } else {
      cx = damp(cx, tx, FOLLOW, dt);
      cy = damp(cy, ty, FOLLOW, dt);
    }

    strength = damp(strength, over ? 1 : 0, GROW, dt);

    // Fully hidden and staying hidden: write once, then idle.
    if (strength < 0.003 && !over) {
      if (!settled) {
        path.style.opacity = "0";
        settled = true;
      }
      prevX = cx;
      prevY = cy;
      return;
    }
    settled = false;

    // Velocity, in viewBox units per second, smoothed.
    const instX = dt > 0 ? (cx - prevX) / dt : 0;
    const instY = dt > 0 ? (cy - prevY) / dt : 0;
    prevX = cx;
    prevY = cy;
    velX = damp(velX, instX, VEL_SMOOTH, dt);
    velY = damp(velY, instY, VEL_SMOOTH, dt);

    const speed = Math.hypot(velX, velY);
    let ux = 1;
    let uy = 0;
    let stretch = 0;
    if (!reduced && speed > 1) {
      ux = velX / speed;
      uy = velY / speed;
      stretch = clamp(speed / 1600, 0, 1) * STRETCH_MAX;
    }

    const scale = VW / cssWidth; // viewBox units per CSS pixel
    const radiusCss = clamp(cssWidth * RADIUS_RATIO, RADIUS_MIN, RADIUS_MAX);
    // Grows out of the pointer rather than popping in at full size.
    const radius = radiusCss * scale * (0.18 + 0.82 * strength);

    const t = reduced ? 0 : _time;

    for (let i = 0; i < POINTS; i += 1) {
      const s = SHAPE[i]!;
      const angle = (i / POINTS) * TAU;
      const morph = reduced ? 0 : s.amp * Math.sin(t * s.freq * TAU + s.phase);
      const r = radius * (1 + s.bias + morph);

      // Unit circle, then stretched along the direction of travel.
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const along = (cosA * ux + sinA * uy) * (1 + stretch);
      const perp = (-cosA * uy + sinA * ux) * (1 - stretch * 0.5);

      xs[i] = cx + (along * ux - perp * uy) * r;
      ys[i] = cy + (along * uy + perp * ux) * r;
    }

    path.setAttribute("d", buildPath());
    path.style.opacity = strength.toFixed(3);
  }

  gsap.ticker.add(tick);

  return () => {
    gsap.ticker.remove(tick);
    observer.disconnect();
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    window.removeEventListener("touchend", onUp);
    window.removeEventListener("touchcancel", onUp);
    path.style.opacity = "0";
  };
}
