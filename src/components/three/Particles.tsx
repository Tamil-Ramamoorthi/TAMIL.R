import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, type Points, type PointsMaterial } from "three";
import type { QualityBudget } from "../../config/site";
import { useCharacterRig } from "../Character/CharacterRig";
import { scenePalette } from "./palette";

/**
 * AMBIENT PARTICLES
 * A soft dust field that gives the hero depth. Count comes from the device
 * quality budget (420 on desktop down to 90 on mobile), positions are
 * generated once, and the whole field is a single draw call.
 */
export interface ParticlesProps {
  budget: QualityBudget;
  reducedMotion: boolean;
}

export function Particles({ budget, reducedMotion }: ParticlesProps) {
  const pointsRef = useRef<Points>(null);
  const materialRef = useRef<PointsMaterial>(null);
  const rig = useCharacterRig();

  const { positions } = useMemo(() => {
    const total = budget.particleCount;
    const array = new Float32Array(total * 3);

    let seed = 19860712;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let index = 0; index < total; index += 1) {
      array[index * 3] = (random() - 0.5) * 12;
      array[index * 3 + 1] = random() * 5 - 1;
      array[index * 3 + 2] = (random() - 0.5) * 7;
    }

    return { positions: array };
  }, [budget.particleCount]);

  useFrame((state, delta) => {
    const points = pointsRef.current;
    if (!points || reducedMotion) return;

    const dt = Math.min(delta, 1 / 20);

    // Very slow vertical drift plus the environment layer of the rig.
    points.rotation.y += dt * 0.012;
    points.position.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.06;
    points.rotation.x = -rig.environment.pitch * 0.6;

    /* ---------- AI signal ----------
       The ambient dust is the earliest, quietest sign that something is
       happening: it brightens and thickens slightly as the transformation
       begins, then holds. It is not the dissolve — that is AiTransformation. */
    const material = materialRef.current;
    if (material) {
      const { signal } = rig.transform;
      material.opacity = 0.5 + signal * 0.3;
      material.size = 0.015 * (1 + signal * 0.5);
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.015}
        sizeAttenuation
        color={scenePalette.accentBright}
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
