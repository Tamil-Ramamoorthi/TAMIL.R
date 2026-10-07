import { useFrame, useThree } from "@react-three/fiber";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  breathe,
  createBlinkController,
  createGazeAngles,
  gazeAnglesTo,
  settleOffset,
  type GazeAngles,
} from "../../animations/characterTracking";
import {
  burstAt,
  dissolveAt,
  portraitAt,
  signalAt,
  sweepAt,
  type TransformProgress,
} from "../../animations/heroTransformation";
import { clamp, damp } from "../../animations/math";
import {
  gazeGeometry,
  idleBehaviour,
  rigDamping,
  rigLimits,
  type QualityBudget,
} from "../../config/site";
import { getLocalPointer } from "../../hooks/pointerStore";

/**
 * CHARACTER RIG
 * =============
 * The cursor interaction hierarchy, in one place:
 *
 *     cursor → eyes → head → body → environment
 *
 * The pointer is projected onto a plane in front of the character
 * (`gazeGeometry`) and the gaze angles are derived from that point
 * geometrically. Each layer then damps towards the same angles at its own
 * rate and under its own ceiling, so the eyes arrive first, the head follows
 * a beat later with roughly half the travel, and the body barely registers.
 *
 * ONE `useFrame`, ZERO RENDERS
 * ----------------------------
 * This updates a single stable object. Consumers read it inside their own
 * frame callback, so the whole scene is cursor-driven without React seeing a
 * pointer move — no `setState(pointer.x)` anywhere in the tree.
 *
 * REDUCED MOTION
 * --------------
 * Targets are pinned to neutral and the idle layer is skipped entirely: no
 * gaze, no settle, no breath, no blink. Combined with the canvas's
 * `frameloop="demand"`, the scene renders once and the GPU goes idle.
 */

/** Gaze for one layer. See characterTracking.ts for the sign convention. */
export interface RigLayer {
  /** Positive = looking up. */
  pitch: number;
  /** Positive = looking toward scene +X. */
  yaw: number;
}

export interface RigState {
  eyes: RigLayer;
  head: RigLayer;
  body: RigLayer;
  environment: RigLayer;
  /**
   * Damped offset from the head to the point being attended to, in scene
   * units. Consumers use this to converge two eyes on one spot; it is damped
   * at the eye rate so vergence and gaze arrive together.
   */
  look: { x: number; y: number; z: number };
  /** 0..1 chest expansion. */
  breath: number;
  /** 0..1 eyelid closure; 1 = fully shut. */
  blink: number;
  /** True while the pointer is over the canvas. */
  over: boolean;
  /** Damped, normalised gaze input (-1..1 on each axis). */
  gaze: { x: number; y: number };
  /**
   * The Phase 3B human → AI stages, derived once per frame from the single
   * progress value. Every scene consumer reads these rather than recomputing
   * the curves, so the dissolve, the sweep and the particles can never
   * disagree about where the transformation is.
   */
  transform: RigTransform;
}

/** Stage values for the human → AI transformation, all 0..1. */
export interface RigTransform {
  /** Raw progress. 0 = fully human, 1 = fully AI. */
  progress: number;
  /** AI signals ramping in. */
  signal: number;
  /** Light sweep position across the character. */
  sweep: number;
  /** How far gone the character is. */
  dissolve: number;
  /** Fragment density — a bell, peaking mid-dissolve. */
  burst: number;
  /** AI portrait rising to dominance. */
  portrait: number;
}

function createRigState(): RigState {
  return {
    eyes: { pitch: 0, yaw: 0 },
    head: { pitch: 0, yaw: 0 },
    body: { pitch: 0, yaw: 0 },
    environment: { pitch: 0, yaw: 0 },
    look: { x: 0, y: 0, z: gazeGeometry.distance },
    breath: 0,
    blink: 0,
    over: false,
    gaze: { x: 0, y: 0 },
    transform: {
      progress: 0,
      signal: 0,
      sweep: 0,
      dissolve: 0,
      burst: 0,
      portrait: 0,
    },
  };
}

const neutralRig = createRigState();
const RigContext = createContext<RigState>(neutralRig);

/** Read the rig inside a `useFrame` callback. */
export const useCharacterRig = (): RigState => useContext(RigContext);

export interface CharacterRigProps {
  budget: QualityBudget;
  reducedMotion: boolean;
  /**
   * The hero transformation carrier. Omitted when Phase 3B is off, in which
   * case every stage stays at 0 and the scene behaves exactly as it did.
   */
  progress?: TransformProgress;
  children: ReactNode;
}

export function CharacterRig({
  budget,
  reducedMotion,
  progress,
  children,
}: CharacterRigProps) {
  const canvas = useThree((state) => state.gl.domElement);

  const rig = useMemo(createRigState, []);
  const blink = useMemo(
    () => createBlinkController(idleBehaviour.blink),
    [],
  );
  // Scratch objects, allocated once — this loop must not produce garbage.
  const target = useMemo<GazeAngles>(createGazeAngles, []);
  const settle = useMemo<GazeAngles>(createGazeAngles, []);

  useFrame((state, delta) => {
    // Clamped so a dropped frame cannot produce a visible jump.
    const dt = Math.min(delta, 1 / 20);
    const elapsed = state.clock.elapsedTime;

    let px = 0;
    let py = 0;
    let over = false;

    if (!reducedMotion) {
      const pointer = getLocalPointer(canvas);
      over = pointer.over;
      if (over) {
        px = clamp(pointer.nx, -1, 1);
        py = clamp(pointer.ny, -1, 1);
      }
    }

    rig.over = over;

    /* ---------- Idle settle ----------
       Larger once the pointer has left the hero, because that is when the
       character has nothing to look at and stillness would read as a freeze.
       Never applied to the body or the environment. */
    let settlePitch = 0;
    let settleYaw = 0;
    if (!reducedMotion) {
      settleOffset(elapsed, settle);
      const amount = over
        ? idleBehaviour.settleOver
        : idleBehaviour.settleAway;
      settlePitch = settle.pitch * amount;
      settleYaw = settle.yaw * amount;
    }

    /* ---------- Look point ----------
       Damped at the eye rate so the vergence the model derives from it stays
       in step with the eye rotation itself. */
    const eyeRate = rigDamping.eyes * 60;
    rig.gaze.x = damp(rig.gaze.x, px, eyeRate, dt);
    rig.gaze.y = damp(rig.gaze.y, py, eyeRate, dt);
    rig.look.x = rig.gaze.x * gazeGeometry.reachX;
    rig.look.y = rig.gaze.y * gazeGeometry.reachY;
    rig.look.z = gazeGeometry.distance;

    /* ---------- Gaze angles ----------
       Derived from the undamped pointer; each layer does its own damping. */
    gazeAnglesTo(
      px * gazeGeometry.reachX,
      py * gazeGeometry.reachY,
      gazeGeometry.distance,
      target,
    );

    const gain = budget.parallax;

    const apply = (
      layer: RigLayer,
      limit: { pitch: number; yaw: number },
      lambda: number,
      settleScale: number,
    ) => {
      // `lambda * 60` converts the per-frame factor into a per-second rate.
      const rate = lambda * 60;

      // Cursor contribution, then the idle settle, then a hard clamp — so the
      // two inputs together can never exceed the layer's budget.
      const pitch = clamp(
        target.pitch * gain + settlePitch * limit.pitch * settleScale,
        -limit.pitch,
        limit.pitch,
      );
      const yaw = clamp(
        target.yaw * gain + settleYaw * limit.yaw * settleScale,
        -limit.yaw,
        limit.yaw,
      );

      layer.pitch = damp(layer.pitch, pitch, rate, dt);
      layer.yaw = damp(layer.yaw, yaw, rate, dt);
    };

    apply(rig.eyes, rigLimits.eyes, rigDamping.eyes, 1);
    apply(rig.head, rigLimits.head, rigDamping.head, 0.5);
    apply(rig.body, rigLimits.body, rigDamping.body, 0);
    apply(rig.environment, rigLimits.environment, rigDamping.environment, 0);

    /* ---------- Transformation stages ----------
       One number in, five stage values out. Cheap enough to do unconditionally,
       and doing it here means there is exactly one place that knows the
       choreography. */
    const p = progress ? progress.value : 0;
    const t = rig.transform;
    t.progress = p;
    t.signal = signalAt(p);
    t.sweep = sweepAt(p);
    t.dissolve = dissolveAt(p);
    t.burst = burstAt(p);
    t.portrait = portraitAt(p);

    /* ---------- Idle channels ---------- */
    if (reducedMotion) {
      rig.breath = 0;
      rig.blink = 0;
    } else {
      rig.breath = breathe(elapsed, idleBehaviour.breathRate);
      rig.blink = blink.update(dt);
    }
  });

  return <RigContext.Provider value={rig}>{children}</RigContext.Provider>;
}
