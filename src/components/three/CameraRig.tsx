import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";
import { damp } from "../../animations/math";
import { useCharacterRig } from "../Character/CharacterRig";

/**
 * CAMERA RIG
 * The outermost layer of the interaction hierarchy — the camera moves least
 * and slowest, which is what keeps the parallax feeling like depth rather than
 * like the whole scene swaying.
 */
export interface CameraRigProps {
  /** Scales the whole effect; 0 pins the camera. */
  strength?: number;
  reducedMotion: boolean;
}

const LOOK_AT = new Vector3(0.35, 0.05, 0);

export function CameraRig({ strength = 1, reducedMotion }: CameraRigProps) {
  const camera = useThree((state) => state.camera);
  const rig = useCharacterRig();
  const base = useRef({ x: camera.position.x, y: camera.position.y });

  useFrame((_, delta) => {
    if (reducedMotion || strength === 0) {
      camera.lookAt(LOOK_AT);
      return;
    }

    const dt = Math.min(delta, 1 / 20);

    // Positions, not rotations — the camera drifts the same way the cursor
    // moves, which is what makes the parallax read as depth.
    const targetX = base.current.x + rig.environment.yaw * 2.6 * strength;
    const targetY = base.current.y + rig.environment.pitch * 1.6 * strength;

    camera.position.x = damp(camera.position.x, targetX, 1.6, dt);
    camera.position.y = damp(camera.position.y, targetY, 1.6, dt);
    camera.lookAt(LOOK_AT);
  });

  return null;
}
