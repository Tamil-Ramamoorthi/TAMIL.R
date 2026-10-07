import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import type { QualityBudget } from "../../config/site";
import { useCharacterRig } from "../Character/CharacterRig";
import { scenePalette } from "./palette";

/**
 * HERO ENVIRONMENT
 * A restrained AI workspace: floor, desk, monitor, laptop and a small cluster
 * of data nodes. It is the slowest layer in the interaction hierarchy, so it
 * drifts well behind the character and never competes with the typography.
 *
 * Deliberately avoided: floating cubes, neon everywhere, gaming aesthetics.
 * The only emissive surfaces are the two screens.
 */
export interface WorkspaceEnvironmentProps {
  budget: QualityBudget;
}

/** Small node cluster standing in for a data graph. */
function DataNodes({ count }: { count: number }) {
  const nodes = useMemo(() => {
    // Deterministic layout — a fixed seed keeps the composition stable.
    let seed = 20260101;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    return Array.from({ length: count }, () => ({
      position: [
        1.6 + random() * 1.5,
        0.55 + random() * 1.35,
        -0.9 + random() * 1.1,
      ] as [number, number, number],
      scale: 0.012 + random() * 0.016,
    }));
  }, [count]);

  return (
    <group>
      {nodes.map((node, index) => (
        <mesh key={index} position={node.position}>
          <sphereGeometry args={[node.scale, 8, 8]} />
          <meshBasicMaterial
            color={scenePalette.accentBright}
            transparent
            opacity={0.55}
          />
        </mesh>
      ))}
    </group>
  );
}

export function WorkspaceEnvironment({ budget }: WorkspaceEnvironmentProps) {
  const rig = useCharacterRig();
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.x = -rig.environment.pitch;
    groupRef.current.rotation.y = rig.environment.yaw;
  });

  return (
    <group ref={groupRef}>
      {/* ---------- Floor ---------- */}
      <mesh
        position={[0, -1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow={budget.shadows}
      >
        <planeGeometry args={[46, 46]} />
        <meshStandardMaterial
          color={scenePalette.bg}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* ---------- Desk ---------- */}
      <group position={[-1.45, 0, 0.25]}>
        <mesh position={[0, -0.36, 0]} castShadow={budget.shadows} receiveShadow>
          <boxGeometry args={[2.5, 0.05, 1.05]} />
          <meshStandardMaterial
            color={scenePalette.surface}
            roughness={0.6}
            metalness={0.25}
          />
        </mesh>

        {/* Legs */}
        {[-1.1, 1.1].map((x) => (
          <mesh key={x} position={[x, -0.68, 0]}>
            <boxGeometry args={[0.05, 0.6, 0.05]} />
            <meshStandardMaterial
              color={scenePalette.line}
              roughness={0.5}
              metalness={0.4}
            />
          </mesh>
        ))}

        {/* ---------- Monitor ---------- */}
        <group position={[-0.1, 0.12, -0.3]}>
          <mesh>
            <boxGeometry args={[1.32, 0.78, 0.04]} />
            <meshStandardMaterial
              color={scenePalette.line}
              roughness={0.45}
              metalness={0.5}
            />
          </mesh>
          <mesh position={[0, 0, 0.025]}>
            <planeGeometry args={[1.24, 0.7]} />
            <meshStandardMaterial
              color={scenePalette.accent}
              emissive={scenePalette.accent}
              emissiveIntensity={0.55}
              roughness={1}
            />
          </mesh>
          <mesh position={[0, -0.52, 0]}>
            <boxGeometry args={[0.08, 0.26, 0.08]} />
            <meshStandardMaterial color={scenePalette.line} metalness={0.5} />
          </mesh>
        </group>

        {/* ---------- Laptop ---------- */}
        <group position={[0.82, -0.3, 0.2]} rotation={[0, -0.42, 0]}>
          <mesh position={[0, 0.01, 0]}>
            <boxGeometry args={[0.52, 0.02, 0.36]} />
            <meshStandardMaterial
              color={scenePalette.surfaceLight}
              roughness={0.4}
              metalness={0.6}
            />
          </mesh>
          <group position={[0, 0.02, -0.18]} rotation={[-1.16, 0, 0]}>
            <mesh position={[0, 0.17, 0]}>
              <boxGeometry args={[0.52, 0.34, 0.012]} />
              <meshStandardMaterial
                color={scenePalette.surfaceLight}
                roughness={0.4}
                metalness={0.6}
              />
            </mesh>
            <mesh position={[0, 0.17, 0.008]}>
              <planeGeometry args={[0.48, 0.3]} />
              <meshStandardMaterial
                color={scenePalette.accentBright}
                emissive={scenePalette.accentBright}
                emissiveIntensity={0.42}
                roughness={1}
              />
            </mesh>
          </group>
        </group>
      </group>

      <DataNodes count={budget.particleCount > 200 ? 14 : 8} />
    </group>
  );
}
