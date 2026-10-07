import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createTransformProgress,
  runTransformation,
  type TransformProgress,
  type TransformationHandle,
} from "../animations/heroTransformation";
import { features, type HeroPhase } from "../config/site";

/**
 * HERO EXPERIENCE
 * ===============
 * The hero's phase machine:
 *
 *     human → activating → transforming → ai
 *
 * DETERMINISTIC, AND ONE-WAY
 * --------------------------
 * `activate()` is the only entry point, and it is ignored unless the phase is
 * `human`. Nothing else can move the machine, nothing reverses it, and there is
 * no timer that starts it on its own — so the hero cannot flicker between
 * identities or transform at a visitor who never touched it.
 *
 * TWO KINDS OF STATE, DELIBERATELY SPLIT
 * --------------------------------------
 *   `phase`     React state. Changes exactly three times in a session, and
 *               only structural things (does the orbit exist?) depend on it.
 *   `progress`  A plain mutable object. Written by GSAP, read inside frame
 *               loops. NEVER React state — a tween that re-rendered the tree 90
 *               times would defeat the whole point.
 *
 * So the transformation costs three renders in total, not one per frame.
 */

export interface HeroExperience {
  readonly phase: HeroPhase;
  /** Live 0..1 carrier. Read it in a frame loop; it never triggers a render. */
  readonly progress: TransformProgress;
  /** Idempotent, and a no-op unless the phase is `human`. */
  readonly activate: () => void;
  /** True when the Phase 3B sequence is switched on at all. */
  readonly enabled: boolean;
  /** True once the AI portrait should be the dominant visual. */
  readonly isAi: boolean;
}

export function useHeroExperience(): HeroExperience {
  const enabled = features.heroTransformation;

  const [phase, setPhase] = useState<HeroPhase>("human");
  const progress = useMemo(createTransformProgress, []);

  const handleRef = useRef<TransformationHandle | null>(null);
  // Guards against a second activation racing the first — pointerenter and
  // pointerdown can both fire for one touch.
  const startedRef = useRef(false);

  const activate = useCallback(() => {
    if (!enabled || startedRef.current) return;
    startedRef.current = true;

    setPhase("activating");

    handleRef.current = runTransformation({
      progress,
      onPhase: (next) => setPhase(next),
    });
  }, [enabled, progress]);

  useEffect(
    () => () => {
      handleRef.current?.kill();
      handleRef.current = null;
    },
    [],
  );

  return {
    phase,
    progress,
    activate,
    enabled,
    isAi: phase === "ai",
  };
}
