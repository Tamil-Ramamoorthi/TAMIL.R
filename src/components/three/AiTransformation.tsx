import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  Color,
  type Mesh,
  type MeshBasicMaterial,
  type Points,
  type ShaderMaterial,
} from "three";
import type { QualityBudget } from "../../config/site";
import { useCharacterRig } from "../Character/CharacterRig";
import { scenePalette } from "./palette";

/**
 * AI TRANSFORMATION
 * =================
 * The scene-side half of the human → AI sequence: the light sweep that passes
 * across the character, and the fragments it dissolves into.
 *
 * WHY A SHADER FOR THE FRAGMENTS
 * ------------------------------
 * Each fragment has to travel its own outward path as the dissolve advances.
 * Doing that on the CPU means rewriting ~2,700 floats and re-uploading the
 * position buffer every frame. In the vertex shader the buffer is uploaded once
 * and the dissolve is a single uniform, so the whole effect costs one draw call
 * and one float per frame.
 *
 * The geometry is generated once from a fixed seed, so the dissolve looks the
 * same on every run.
 *
 * COST WHEN IDLE
 * --------------
 * Both objects set `visible = false` while `burst`/`sweep` are zero, which is
 * every frame before the visitor interacts and every frame after the
 * transformation finishes. Nothing here is drawn during the states that
 * dominate a normal visit.
 */

export interface AiTransformationProps {
  budget: QualityBudget;
  /** Character position along X, so the fragments spawn where the figure is. */
  x: number;
  /** Character scale, so the fragment volume matches the figure. */
  scale: number;
}

const VERTEX = /* glsl */ `
  attribute vec3 aDir;
  attribute float aSeed;

  uniform float uDissolve;
  uniform float uSize;

  varying float vSeed;

  void main() {
    vSeed = aSeed;

    // Fragments drift outward along their own direction and lift as they go,
    // so the character appears to come apart rather than simply fade.
    vec3 p = position + aDir * uDissolve * (0.3 + aSeed * 0.8);
    p.y += uDissolve * (0.2 + aSeed * 0.55);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (0.6 + aSeed * 0.8) * (260.0 / max(0.001, -mv.z));
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT = /* glsl */ `
  precision mediump float;

  uniform vec3 uColor;
  uniform vec3 uColorHot;
  uniform float uAlpha;

  varying float vSeed;

  void main() {
    // Round, soft-edged points. A square particle reads as a bug.
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.06, d);

    // A minority of fragments run hotter, which gives the cloud some internal
    // variation without a second draw call.
    vec3 tint = mix(uColor, uColorHot, step(0.82, vSeed));

    gl_FragColor = vec4(tint, soft * uAlpha);
  }
`;

export function AiTransformation({ budget, x, scale }: AiTransformationProps) {
  const rig = useCharacterRig();

  const pointsRef = useRef<Points>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const sweepRef = useRef<Mesh>(null);
  const sweepMaterialRef = useRef<MeshBasicMaterial>(null);

  /* ---------- Fragment cloud, generated once ---------- */
  const { positions, directions, seeds } = useMemo(() => {
    const total = budget.dissolveParticles;
    const pos = new Float32Array(total * 3);
    const dir = new Float32Array(total * 3);
    const seed = new Float32Array(total);

    let state = 20260512;
    const random = () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };

    for (let i = 0; i < total; i += 1) {
      // A standing human volume: a narrow column, denser toward the middle.
      const height = random();
      const radius = 0.16 + Math.sqrt(random()) * 0.24;
      const angle = random() * Math.PI * 2;

      const px = Math.cos(angle) * radius;
      const py = height * 1.82;
      const pz = Math.sin(angle) * radius * 0.7;

      pos[i * 3] = px;
      pos[i * 3 + 1] = py;
      pos[i * 3 + 2] = pz;

      // Outward, mostly horizontal — fragments peel off the silhouette.
      const length = Math.hypot(px, pz) || 1;
      dir[i * 3] = (px / length) * (0.6 + random() * 0.8);
      dir[i * 3 + 1] = (random() - 0.3) * 0.5;
      dir[i * 3 + 2] = (pz / length) * (0.6 + random() * 0.8);

      seed[i] = random();
    }

    return { positions: pos, directions: dir, seeds: seed };
  }, [budget.dissolveParticles]);

  const uniforms = useMemo(
    () => ({
      uDissolve: { value: 0 },
      uAlpha: { value: 0 },
      uSize: { value: 0.028 },
      // Real Color instances: a vec3 uniform cannot take a hex string.
      uColor: { value: new Color(scenePalette.accent) },
      uColorHot: { value: new Color(scenePalette.warmFill) },
    }),
    [],
  );

  useFrame(() => {
    const { burst, sweep, dissolve } = rig.transform;

    /* ---------- Fragments ---------- */
    const points = pointsRef.current;
    if (points) {
      // Skipped entirely outside the transformation, which is most of a visit.
      points.visible = burst > 0.001;
      if (points.visible && materialRef.current) {
        const material = materialRef.current;
        material.uniforms.uDissolve!.value = dissolve;
        material.uniforms.uAlpha!.value = burst * 0.72;
      }
    }

    /* ---------- Light sweep ---------- */
    const sweepMesh = sweepRef.current;
    if (sweepMesh) {
      // A bell: the bar is invisible at both ends of its travel, so it reads as
      // a pass of light rather than something that appears and vanishes.
      const presence = Math.sin(Math.PI * Math.min(1, Math.max(0, sweep)));
      sweepMesh.visible = presence > 0.004;

      if (sweepMesh.visible) {
        sweepMesh.position.y = sweep * 2.0 * scale;
        if (sweepMaterialRef.current) {
          sweepMaterialRef.current.opacity = presence * 0.34;
        }
      }
    }
  });

  return (
    <group position={[x, -0.95, 0]}>
      <points ref={pointsRef} scale={scale} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aDir" args={[directions, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          vertexShader={VERTEX}
          fragmentShader={FRAGMENT}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>

      {/* The sweep sits in the group's own space, so it tracks the character. */}
      <mesh ref={sweepRef} position={[0, 0, 0]}>
        <planeGeometry args={[1.5 * scale, 0.085 * scale]} />
        <meshBasicMaterial
          ref={sweepMaterialRef}
          color={scenePalette.accentBright}
          transparent
          opacity={0}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

export default AiTransformation;
