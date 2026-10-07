/**
 * ANIMATION MATH
 * Small, allocation-free helpers used by the rig, cursor and reveal loops.
 */

export const clamp = (value: number, min: number, max: number): number =>
  value < min ? min : value > max ? max : value;

export const lerp = (from: number, to: number, t: number): number =>
  from + (to - from) * t;

/**
 * Frame-rate independent exponential smoothing.
 *
 * Plain `lerp(a, b, 0.1)` runs at a different speed on a 60Hz and a 144Hz
 * display; this does not. `lambda` is the responsiveness (higher = snappier),
 * `dt` the frame delta in seconds.
 */
export function damp(
  current: number,
  target: number,
  lambda: number,
  dt: number,
): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number =>
  outMin + ((value - inMin) / (inMax - inMin || 1)) * (outMax - outMin);

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Pads a number for ledger/counter display: 7 -> "07". */
export const pad2 = (value: number): string =>
  Math.round(value).toString().padStart(2, "0");
