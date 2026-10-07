/**
 * HERO TRANSFORMATION
 * ===================
 * The human → AI sequence: one GSAP tween drives one number, and every visual
 * derives its own stage from that number.
 *
 * WHY ONE NUMBER
 * --------------
 * The character dissolve lives in the WebGL tree, the portrait layer lives in
 * the DOM, and the orbit lives in the DOM too. If each tweened itself they
 * would drift apart on a dropped frame, and the character could finish
 * dissolving before the portrait had arrived — the one thing the brief is most
 * explicit about avoiding. Instead `progress.value` is the single source of
 * truth and the stage functions below are pure, so the choreography is the
 * same in every consumer and can be reasoned about without a browser.
 *
 * `progress` is a plain mutable object, never React state. It is written by
 * GSAP and read inside `useFrame` / `gsap.ticker` callbacks, which is the same
 * pattern `useAppLoading` already uses for the preloader counter.
 *
 * STAGE WINDOWS live in `heroStages` in src/config/site.ts.
 */

import { heroStages, heroTransformation } from "../config/site";
import { clamp, smoothstep } from "./math";
import { gsap, motionEnabled } from "./gsapSetup";

/** The live progress carrier. 0 = fully human, 1 = fully AI. */
export interface TransformProgress {
  value: number;
}

export const createTransformProgress = (): TransformProgress => ({ value: 0 });

/* ==========================================================================
   STAGE CURVES
   Each returns 0..1 for its own window, so a consumer never has to know where
   in the overall timeline it sits.
   ========================================================================== */

const windowAt = (
  progress: number,
  range: { from: number; to: number },
): number => smoothstep(range.from, range.to, progress);

/** AI signals ramping in: particles, blue light. The first thing to move. */
export const signalAt = (progress: number): number =>
  windowAt(progress, heroStages.signal);

/** The light sweep travelling across the character, 0..1 of its path. */
export const sweepAt = (progress: number): number =>
  windowAt(progress, heroStages.sweep);

/** How far gone the character is. 1 = fully dissolved. */
export const dissolveAt = (progress: number): number =>
  windowAt(progress, heroStages.dissolve);

/** The AI portrait rising to dominance. */
export const portraitAt = (progress: number): number =>
  windowAt(progress, heroStages.portrait);

/**
 * Fragment density — a bell, not a ramp. Density has to *increase briefly* and
 * then fall away, otherwise the particles are still thickening after the
 * character has gone and the hero ends as a particle demo.
 */
export function burstAt(progress: number): number {
  const peak = heroStages.burstPeak;
  const width = 0.34;
  const offset = (progress - peak) / width;
  const bell = Math.exp(-offset * offset * 2.2);
  // Pinned to zero at both ends so nothing lingers in the final state.
  return clamp(bell, 0, 1) * (1 - smoothstep(0.9, 1, progress));
}

/* ==========================================================================
   TIMELINE
   ========================================================================== */

export interface TransformationOptions {
  progress: TransformProgress;
  /** Called on each phase boundary. Discrete — four calls, not per frame. */
  onPhase: (phase: "transforming" | "ai") => void;
}

export interface TransformationHandle {
  /** Stops the tween and leaves progress where it is. */
  kill(): void;
}

/**
 * Builds and starts the transformation.
 *
 * Under reduced motion there is no tween at all: progress jumps to 1 and the
 * phase goes straight to `ai`, so the visitor gets the finished AI portrait and
 * a static orbit with nothing animating. The sequence is still gated behind the
 * interaction — it is instant, not automatic.
 */
export function runTransformation({
  progress,
  onPhase,
}: TransformationOptions): TransformationHandle {
  if (!motionEnabled()) {
    progress.value = 1;
    onPhase("transforming");
    onPhase("ai");
    return { kill: () => {} };
  }

  const timeline = gsap.timeline({
    delay: heroTransformation.activateDelay,
    onStart: () => onPhase("transforming"),
    onComplete: () => onPhase("ai"),
  });

  timeline.to(progress, {
    value: 1,
    duration: heroTransformation.duration,
    // Ease-out: the dissolve commits early and settles, rather than
    // accelerating into the finish, which would read as a cut.
    ease: "power2.out",
  });

  return {
    kill: () => {
      timeline.kill();
    },
  };
}
