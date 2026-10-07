import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";
import { idleBehaviour } from "../../config/site";
import { scenePalette } from "../three/palette";
import { useCharacterRig } from "./CharacterRig";

/**
 * CHARACTER PLACEHOLDER
 * =====================
 * Deliberately NOT a character.
 *
 * This is a blocked-out identity volume on a plinth — the kind of grey-box
 * stand-in used while a real model is in production. Its only job is to prove
 * the rig, so it exercises every channel the real character will:
 *
 *   gaze points   fastest, and they converge
 *   head volume   follows at roughly half the travel
 *   body          drifts last, barely
 *   breath        a few millimetres of vertical lift
 *   blink         the gaze points flatten
 *
 * It is gated behind `features.characterPlaceholder` (off by default) and is
 * replaced wholesale by `CharacterModel`. Nothing here is intended to ship as
 * the final visual.
 */

/** Matches CharacterModel, so swapping the two does not move the figure. */
const GROUND_Y = -0.95;

/** Half the distance between the gaze points, in local units. */
const EYE_OFFSET = 0.1;
/** How far forward the gaze points sit — the vergence baseline. */
const EYE_FORWARD = 0.21;

export interface CharacterPlaceholderProps {
  /** X position in the scene; set by HeroScene. */
  x?: number;
  /** Scale multiplier from the device quality budget. */
  scale?: number;
}

export function CharacterPlaceholder({
  x = 0.75,
  scale = 1,
}: CharacterPlaceholderProps) {
  const rig = useCharacterRig();

  const rootRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const eyeLeftRef = useRef<Mesh>(null);
  const eyeRightRef = useRef<Mesh>(null);

  useFrame(() => {
    const root = rootRef.current;

    // The grey box dissolves too, so the transformation is reviewable before a
    // real model exists. Scale rather than opacity: a box full of transparent
    // faces shows its own interior as it fades.
    if (root) {
      const { dissolve } = rig.transform;
      root.visible = dissolve < 0.999;
      if (!root.visible) return;
      root.scale.setScalar(scale * (1 - dissolve * 0.35));
    }

    if (root) {
      root.position.y =
        GROUND_Y + rig.breath * idleBehaviour.breathLift * scale;
    }

    // Negated pitch: positive gaze pitch means "up", positive rotation.x
    // tilts a +Z-facing node down. See animations/characterTracking.ts.
    if (bodyRef.current) {
      bodyRef.current.rotation.x = -rig.body.pitch;
      bodyRef.current.rotation.y = rig.body.yaw;
    }
    if (headRef.current) {
      headRef.current.rotation.x = -rig.head.pitch;
      headRef.current.rotation.y = rig.head.yaw;
    }

    /* ---------- Gaze points ----------
       Each point is translated along the gaze, then nudged by its own lateral
       offset so the pair converges rather than moving in lockstep. The blink
       squashes them vertically — the one channel a grey box can honestly show. */
    const lid = 1 - rig.blink * 0.92;

    for (const [ref, side] of [
      [eyeLeftRef, -1],
      [eyeRightRef, 1],
    ] as const) {
      const eye = ref.current;
      if (!eye) continue;

      const converge = -side * EYE_OFFSET * (EYE_FORWARD / rig.look.z);

      eye.position.x = side * EYE_OFFSET + rig.eyes.yaw * 0.05 + converge;
      eye.position.y = rig.eyes.pitch * 0.03;
      eye.scale.set(1, lid, 1);
    }
  });

  return (
    <group ref={rootRef} position={[x, GROUND_Y, 0]} scale={scale}>
      {/* ---------- Plinth ---------- */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[0.95, 0.95, 0.06, 48]} />
        <meshStandardMaterial
          color={scenePalette.surface}
          roughness={0.75}
          metalness={0.15}
        />
      </mesh>

      <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.02, 0.004, 8, 96]} />
        <meshBasicMaterial color={scenePalette.accent} transparent opacity={0.6} />
      </mesh>

      {/* ---------- Blocked-out body ---------- */}
      <group ref={bodyRef}>
        <mesh position={[0, 1.05, 0]} castShadow>
          <capsuleGeometry args={[0.34, 0.62, 8, 28]} />
          <meshStandardMaterial
            color={scenePalette.surfaceLight}
            roughness={0.55}
            metalness={0.2}
            transparent
            opacity={0.72}
          />
        </mesh>

        <mesh position={[0, 1.05, 0]}>
          <capsuleGeometry args={[0.345, 0.62, 4, 14]} />
          <meshBasicMaterial
            color={scenePalette.accent}
            wireframe
            transparent
            opacity={0.1}
          />
        </mesh>

        {/* ---------- Head volume ---------- */}
        <group ref={headRef} position={[0, 1.78, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.5, 0.4]} />
            <meshStandardMaterial
              color={scenePalette.surfaceLight}
              roughness={0.5}
              metalness={0.25}
              transparent
              opacity={0.78}
            />
          </mesh>
          <mesh>
            <boxGeometry args={[0.425, 0.505, 0.405]} />
            <meshBasicMaterial
              color={scenePalette.accentBright}
              wireframe
              transparent
              opacity={0.16}
            />
          </mesh>

          {/* Gaze points live inside the head, so they inherit its rotation
              and only add their own faster offset on top. */}
          <mesh ref={eyeLeftRef} position={[-EYE_OFFSET, 0.04, EYE_FORWARD]}>
            <sphereGeometry args={[0.022, 12, 12]} />
            <meshBasicMaterial color={scenePalette.accentBright} />
          </mesh>
          <mesh ref={eyeRightRef} position={[EYE_OFFSET, 0.04, EYE_FORWARD]}>
            <sphereGeometry args={[0.022, 12, 12]} />
            <meshBasicMaterial color={scenePalette.accentBright} />
          </mesh>
        </group>
      </group>

      {/* ---------- Light shaft ---------- */}
      <mesh position={[0, 2.9, 0]}>
        <cylinderGeometry args={[0.02, 0.5, 2.1, 24, 1, true]} />
        <meshBasicMaterial
          color={scenePalette.accent}
          transparent
          opacity={0.045}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
