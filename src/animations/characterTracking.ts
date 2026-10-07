/**
 * CHARACTER TRACKING
 * ==================
 * Pure, allocation-free math for the cursor → gaze hierarchy and the idle
 * layer. No React, no three.js — so the grey-box placeholder and the real
 * rigged model can share one implementation, and the behaviour can be reasoned
 * about without a GPU.
 *
 * ANGLE CONVENTION
 * ----------------
 * Everything here speaks in *gaze* angles, never raw Euler rotations:
 *
 *     pitch   positive = looking UP
 *     yaw     positive = looking toward scene +X (the viewer's right)
 *
 * three.js rotates a +Z-facing node's forward axis toward -Y for a positive X
 * rotation, so a consumer applies these as:
 *
 *     object.rotation.x = rest.x - pitch
 *     object.rotation.y = rest.y + yaw
 *
 * That sign flip lives here, documented, in exactly one place. Re-deriving it
 * at each call site is how a character ends up looking at the floor when the
 * cursor is near the top of the hero.
 */

import { clamp } from "./math";

export interface GazeAngles {
  pitch: number;
  yaw: number;
}

export const createGazeAngles = (): GazeAngles => ({ pitch: 0, yaw: 0 });

/**
 * Gaze angles from an offset vector, measured from the pivot towards the point
 * being attended to. `dz` is the forward distance (towards the camera).
 *
 * Writes into `out` rather than returning a new object — this runs every frame.
 */
export function gazeAnglesTo(
  dx: number,
  dy: number,
  dz: number,
  out: GazeAngles,
): GazeAngles {
  // Guarded so a degenerate offset cannot produce NaN mid-frame.
  const forward = Math.hypot(dx, dz) || 1e-6;
  out.yaw = Math.atan2(dx, dz);
  out.pitch = Math.atan2(dy, forward);
  return out;
}

/**
 * VERGENCE
 * The extra yaw one eye needs because it does not sit on the gaze axis.
 *
 * This is what makes two eyes read as *a pair of eyes* rather than two
 * independently swivelling balls: both converge on the same point, so the near
 * eye turns slightly further than the far one. `lateralOffset` is the eye's
 * distance from the head's centre line along X (signed); `distance` is the
 * forward distance to the target.
 *
 * Small-angle approximation, which is all the clamps ever permit.
 */
export function vergenceYaw(lateralOffset: number, distance: number): number {
  if (distance <= 1e-4) return 0;
  return -Math.atan2(lateralOffset, distance);
}

/**
 * BREATHING
 * 0..1 chest expansion. Softened at the top of the curve so the pause at full
 * inhale reads like a breath rather than a sine wave.
 */
export function breathe(elapsed: number, rate: number): number {
  const phase = Math.sin(elapsed * rate * Math.PI * 2);
  const normalised = phase * 0.5 + 0.5;
  return normalised * normalised * (3 - 2 * normalised);
}

/**
 * IDLE SETTLE
 * Two pairs of slow, incommensurate sines, returning roughly -1..1 on each
 * axis. The combined period is long enough that no repeat is perceptible, so
 * a still pointer leaves the character *settling* rather than frozen.
 *
 * The caller scales this by a fraction of the layer's own limit, which is why
 * it is not "random floating movement": the amplitude is a few percent of an
 * already-subtle rotation budget, and it is never applied to the body.
 */
export function settleOffset(elapsed: number, out: GazeAngles): GazeAngles {
  out.yaw =
    Math.sin(elapsed * 0.37) * 0.62 + Math.sin(elapsed * 0.11) * 0.38;
  out.pitch =
    Math.sin(elapsed * 0.29 + 1.7) * 0.55 +
    Math.sin(elapsed * 0.08 + 0.4) * 0.45;
  return out;
}

/* ==========================================================================
   BLINK
   ========================================================================== */

export interface BlinkOptions {
  /** Seconds between blinks, sampled uniformly. */
  readonly minInterval: number;
  readonly maxInterval: number;
  /** Seconds to close, and to reopen. Closing is the faster half. */
  readonly closeDuration: number;
  readonly openDuration: number;
  /** Fixed seed keeps dev reloads comparable. */
  readonly seed?: number;
}

export interface BlinkController {
  /** Advances by `dt` seconds and returns closure, 0 = open, 1 = fully shut. */
  update(dt: number): number;
  /** Returns to fully open and reschedules. */
  reset(): void;
}

/**
 * A blink that is only ever applied when the model actually ships eyelid
 * blendshapes — see CharacterModel. Intervals are randomised so the result is
 * not an obvious loop, and `prefers-reduced-motion` skips `update()` entirely,
 * leaving the eyes open.
 */
export function createBlinkController(
  options: BlinkOptions,
): BlinkController {
  const { minInterval, maxInterval, closeDuration, openDuration } = options;

  // Same small LCG the scene uses elsewhere, so "random" stays reproducible.
  let seed = options.seed ?? 20260315;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const nextInterval = () =>
    minInterval + random() * Math.max(0, maxInterval - minInterval);

  let phase: "wait" | "closing" | "opening" = "wait";
  let timer = nextInterval();
  let closure = 0;

  return {
    update(dt: number): number {
      timer -= dt;

      if (phase === "wait") {
        if (timer <= 0) {
          phase = "closing";
          timer = closeDuration;
        }
        closure = 0;
        return closure;
      }

      if (phase === "closing") {
        const t = closeDuration <= 0 ? 1 : 1 - clamp(timer / closeDuration, 0, 1);
        closure = t * t;
        if (timer <= 0) {
          phase = "opening";
          timer = openDuration;
          closure = 1;
        }
        return closure;
      }

      const t = openDuration <= 0 ? 1 : clamp(timer / openDuration, 0, 1);
      // Eases out, so the lid lifts fast then settles.
      closure = t * (2 - t);
      if (timer <= 0) {
        phase = "wait";
        timer = nextInterval();
        closure = 0;
      }
      return closure;
    },

    reset(): void {
      phase = "wait";
      timer = nextInterval();
      closure = 0;
    },
  };
}
