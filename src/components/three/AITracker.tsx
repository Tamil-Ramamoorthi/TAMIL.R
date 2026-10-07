import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  Color,
  Vector3,
  type BufferGeometry,
  type Group,
  type LineSegments,
  type Mesh,
  type MeshBasicMaterial,
  type Points,
  type PointsMaterial,
} from "three";
import { getOrbitFocus } from "../../animations/heroSignal";
import { damp, smoothstep } from "../../animations/math";
import { sceneLayout, trackerBehaviour, type QualityBudget } from "../../config/site";
import { useCharacterRig } from "../Character/CharacterRig";
import { scenePalette } from "./palette";

/**
 * AI TRACKER
 * ==========
 * A small perception core that follows the cursor. It replaces the 3D figure
 * as the hero's interactive object: the point is to look like a system paying
 * attention, not like a person.
 *
 * WHAT IT IS MADE OF
 * ------------------
 *   core          two nested icosahedra — a solid centre and an additive halo
 *   rings         three thin tori on different axes, counter-rotating
 *   nodes         a small point cloud orbiting the core
 *   links         line segments from the core to each node, rebuilt per frame
 *   scan          a flat ring that expands and fades, then waits
 *
 * All of it is unlit `meshBasicMaterial`, so the tracker is independent of the
 * scene lighting and costs nothing to shade. Geometry is a few hundred
 * triangles against the ~7,000 of the character it replaces, and the GLB is no
 * longer fetched at all.
 *
 * ONE FRAME LOOP, ZERO RENDERS
 * ----------------------------
 * Pointer input arrives through `useCharacterRig()`, which already damps the
 * shared pointer store once per frame for the whole scene. This component adds
 * a second, slower damp of its own — that difference between the rig's rate
 * and this one is what reads as inertia. No pointer value ever reaches React.
 *
 * REDUCED MOTION
 * --------------
 * Everything animated is skipped and the tracker is posed once at its idle
 * state. With the canvas on `frameloop="demand"` that is a single frame, then
 * the GPU idles.
 */
export interface AITrackerProps {
  budget: QualityBudget;
  reducedMotion: boolean;
}

/** Scratch vectors — this loop must not allocate. */
const projected = new Vector3();

export function AITracker({ budget, reducedMotion }: AITrackerProps) {
  const rig = useCharacterRig();

  const groupRef = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);
  const haloRef = useRef<Mesh>(null);
  const haloMatRef = useRef<MeshBasicMaterial>(null);
  const ringsRef = useRef<Group>(null);
  const nodesRef = useRef<Points>(null);
  const nodeMatRef = useRef<PointsMaterial>(null);
  const linksRef = useRef<LineSegments>(null);
  const scanRef = useRef<Mesh>(null);
  const scanMatRef = useRef<MeshBasicMaterial>(null);

  const count = budget.trackerNodes;

  /**
   * Node orbits, generated once. Each node keeps its own radius, inclination,
   * phase and speed so the cloud never looks like a single rotating ring.
   * Seeded, so the arrangement is identical on every load.
   */
  const orbits = useMemo(() => {
    let seed = 20260413;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    return Array.from({ length: count }, () => ({
      radius: 0.26 + random() * 0.26,
      tilt: (random() - 0.5) * 1.4,
      phase: random() * Math.PI * 2,
      speed: 0.18 + random() * 0.26,
      drift: 0.4 + random() * 0.8,
    }));
  }, [count]);

  const nodePositions = useMemo(() => new Float32Array(count * 3), [count]);
  // Two vertices per link: the core, then the node.
  const linkPositions = useMemo(() => new Float32Array(count * 6), [count]);

  /** Damped values that survive between frames. */
  const motion = useMemo(
    () => ({ x: 0, y: 0, focus: 0, energy: 0, scan: 0, spin: 0 }),
    [],
  );

  const colors = useMemo(
    () => ({
      core: new Color(scenePalette.accentBright),
      hot: new Color(scenePalette.warmFill),
      node: new Color(scenePalette.accent),
    }),
    [],
  );

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const dt = Math.min(delta, 1 / 20);
    const elapsed = state.clock.elapsedTime;

    /* ---------- Follow ----------
       `rig.gaze` is the pointer, already damped once for the whole scene.
       Damping it again here, more slowly, is what gives the tracker its lag:
       it trails the cursor rather than being pinned to it. */
    if (!reducedMotion) {
      const targetX = sceneLayout.tracker[0] + rig.gaze.x * trackerBehaviour.reach;
      const targetY =
        sceneLayout.tracker[1] + rig.gaze.y * trackerBehaviour.reach * 0.62;

      motion.x = damp(motion.x, targetX, trackerBehaviour.follow, dt);
      motion.y = damp(motion.y, targetY, trackerBehaviour.follow, dt);
    } else {
      motion.x = sceneLayout.tracker[0];
      motion.y = sceneLayout.tracker[1];
    }

    group.position.set(motion.x, motion.y, sceneLayout.tracker[2]);

    /* ---------- Proximity ----------
       The tracker's own position, projected to normalised device coordinates,
       measured against the pointer. Cheap, and it reuses the pointer the rig
       already read — no second listener anywhere. */
    let focusTarget = 0;
    if (!reducedMotion && rig.over) {
      projected.set(motion.x, motion.y, sceneLayout.tracker[2]);
      projected.project(state.camera);
      const distance = Math.hypot(
        projected.x - rig.gaze.x,
        projected.y - rig.gaze.y,
      );
      focusTarget = 1 - smoothstep(0.12, trackerBehaviour.focusRadius, distance);
    }

    motion.focus = damp(motion.focus, focusTarget, trackerBehaviour.focusDamp, dt);

    /* ---------- Transformation ----------
       `burst` is a bell that peaks mid-dissolve and returns to zero, so the
       tracker spikes while the AI portrait arrives and settles back to idle
       on its own. Nothing here holds a raised state afterwards. */
    const surge = rig.transform.burst;

    /* The technology orbit reports its own attention level through
       `heroSignal`. Folding it in here is what makes the two halves one
       system: hover a Python mark out at the portrait and the core at the
       centre of it responds. The orbit may never mount, in which case this is
       simply 0. */
    const orbit = getOrbitFocus();

    motion.energy = damp(
      motion.energy,
      motion.focus + orbit * 0.8 + surge * 1.4,
      6,
      dt,
    );

    const intensity = Math.min(motion.energy, 1.8);

    /* ---------- Core ---------- */
    const core = coreRef.current;
    if (core) {
      // A slow breath, lifted by attention. Never a pulse that draws the eye.
      const breath = reducedMotion ? 0 : Math.sin(elapsed * 0.9) * 0.05;
      const scale = 1 + breath + intensity * 0.22;
      core.scale.setScalar(scale);
      if (!reducedMotion) core.rotation.y = elapsed * 0.25;
    }

    const halo = haloRef.current;
    const haloMat = haloMatRef.current;
    if (halo && haloMat) {
      halo.scale.setScalar(1 + intensity * 0.5);
      haloMat.opacity = 0.14 + intensity * 0.2;
      haloMat.color.lerpColors(colors.core, colors.hot, Math.min(intensity, 1) * 0.5);
    }

    /* ---------- Rings ----------
       Idle drift, nudged faster while the tracker is attending to something. */
    const rings = ringsRef.current;
    if (rings && !reducedMotion) {
      motion.spin += dt * (trackerBehaviour.idleSpin + intensity * trackerBehaviour.focusSpin);
      rings.rotation.y = motion.spin;
      rings.rotation.x = Math.sin(elapsed * 0.22) * 0.18;
    }

    /* ---------- Nodes and links ----------
       Nodes draw slightly inward as attention rises, which reads as the system
       converging on what it is tracking. */
    const nodes = nodesRef.current;
    const links = linksRef.current;
    if (nodes && links) {
      const pull = 1 - Math.min(intensity, 1) * trackerBehaviour.converge;

      for (let index = 0; index < count; index += 1) {
        const orbit = orbits[index];
        if (!orbit) continue;

        const angle = reducedMotion
          ? orbit.phase
          : orbit.phase + elapsed * orbit.speed;
        const radius = orbit.radius * pull;
        const wobble = reducedMotion
          ? 0
          : Math.sin(elapsed * orbit.drift + orbit.phase) * 0.05;

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * Math.sin(orbit.tilt) + wobble;
        const z = Math.sin(angle) * radius * Math.cos(orbit.tilt);

        nodePositions[index * 3] = x;
        nodePositions[index * 3 + 1] = y;
        nodePositions[index * 3 + 2] = z;

        // Core → node. The first vertex stays at the origin.
        linkPositions[index * 6 + 3] = x;
        linkPositions[index * 6 + 4] = y;
        linkPositions[index * 6 + 5] = z;
      }

      markUpdated(nodes.geometry);
      markUpdated(links.geometry);
    }

    const nodeMat = nodeMatRef.current;
    if (nodeMat) nodeMat.opacity = 0.55 + intensity * 0.35;

    /* ---------- Scan ----------
       One expanding ring, then a long wait. `trackerBehaviour.scanPeriod` is
       deliberately slow: this is a system checking in, not a radar sweep. */
    const scan = scanRef.current;
    const scanMat = scanMatRef.current;
    if (scan && scanMat) {
      if (reducedMotion) {
        scanMat.opacity = 0;
      } else {
        motion.scan += dt / trackerBehaviour.scanPeriod;
        if (motion.scan > 1) motion.scan -= 1;

        // Only the first third of the cycle is the pulse; the rest is quiet.
        const t = Math.min(motion.scan * 3, 1);
        const alive = motion.scan < 1 / 3 ? 1 : 0;
        scan.scale.setScalar(0.5 + t * 1.9);
        scanMat.opacity = alive * (1 - t) * (0.3 + intensity * 0.35);
      }
    }
  });

  return (
    <group ref={groupRef} position={sceneLayout.tracker}>
      {/* Core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.055, 1]} />
        <meshBasicMaterial color={scenePalette.warmFill} toneMapped={false} />
      </mesh>

      {/* Additive halo — the light the core gives off. */}
      <mesh ref={haloRef}>
        <icosahedronGeometry args={[0.12, 2]} />
        <meshBasicMaterial
          ref={haloMatRef}
          color={scenePalette.accentBright}
          transparent
          opacity={0.16}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Rings — thin, on three axes, so the core reads as a volume. */}
      <group ref={ringsRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.0022, 4, 96]} />
          <meshBasicMaterial
            color={scenePalette.accentBright}
            transparent
            opacity={0.5}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0.62, 0]}>
          <torusGeometry args={[0.42, 0.0018, 4, 96]} />
          <meshBasicMaterial
            color={scenePalette.accent}
            transparent
            opacity={0.38}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[0.5, 0, 0.38]}>
          <torusGeometry args={[0.52, 0.0015, 4, 96]} />
          <meshBasicMaterial
            color={scenePalette.accent}
            transparent
            opacity={0.24}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Tracking nodes */}
      <points ref={nodesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[nodePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={nodeMatRef}
          color={scenePalette.accentBright}
          size={0.028}
          sizeAttenuation
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </points>

      {/* Core → node links */}
      <lineSegments ref={linksRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linkPositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={scenePalette.accent}
          transparent
          opacity={0.18}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>

      {/* Scan pulse */}
      <mesh ref={scanRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.305, 96]} />
        <meshBasicMaterial
          ref={scanMatRef}
          color={scenePalette.accentBright}
          transparent
          opacity={0}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/**
 * Flags a position buffer as dirty.
 *
 * The bounding sphere is deliberately NOT recomputed: both buffers belong to
 * objects marked `frustumCulled={false}`, so nothing reads it, and recomputing
 * it every frame would walk the whole array for no benefit. Culling is off
 * because the bound is built once from an all-zero buffer — the same reason
 * Particles opts out.
 */
function markUpdated(geometry: BufferGeometry): void {
  const attribute = geometry.getAttribute("position") as BufferAttribute;
  attribute.needsUpdate = true;
}

export default AITracker;
