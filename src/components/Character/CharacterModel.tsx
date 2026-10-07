import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  Quaternion,
  Vector3,
  type Group,
  type Material,
  type Mesh,
  type Object3D,
} from "three";
import { vergenceYaw } from "../../animations/characterTracking";
import { clamp } from "../../animations/math";
import { assets, publicUrl } from "../../config/assets";
import { gazeGeometry, idleBehaviour } from "../../config/site";
import { useCharacterRig } from "./CharacterRig";

/**
 * CHARACTER MODEL
 * ===============
 * Binds the rig to a supplied GLB/GLTF.
 *
 * Code-split and only ever mounted when `features.character3D` AND
 * `assets.character.model.ready` are both true, so a missing file can never
 * reach this component. A *corrupt* file still can, which is what
 * CharacterLoader's error boundary is for.
 *
 * WHAT IT BINDS TO, IN ORDER OF PREFERENCE
 * ----------------------------------------
 *   1. eye bones + head/neck   full gaze: converged eyes, head follows
 *   2. head/neck only          subtle head tracking, no eye movement
 *   3. neither                 a clamped rotation on the root group
 *
 * Tier 3 exists so an unrigged mesh still reads as cursor-aware instead of
 * dead, but it is intentionally the weakest of the three — the limits are the
 * head's, not the eyes'. Nothing here fakes eye movement by deforming the
 * face: the blink is applied only when the model ships real eyelid
 * blendshapes.
 *
 * WIRING A NEW MODEL
 * ------------------
 * Bones are matched case-insensitively with separators stripped, which covers
 * Mixamo, Ready Player Me, Character Creator, 3ds Max Biped and Blender
 * defaults. A rig with different names needs one entry added to
 * BONE_CANDIDATES — that is the only change required.
 *
 * All rotations are applied as offsets on top of each bone's REST pose, so the
 * model's own proportions and any baked animation are left intact.
 *
 * WHY THE AXES ARE DERIVED AND NOT ASSUMED
 * ----------------------------------------
 * A bone's local frame is whatever the rig author left it as, and it is NOT
 * safe to assume `rotation.y` yaws. The Rocketbox Biped is the worked example:
 *
 *   head / neck / spine   local +X runs UP the bone, local +Z is world +X
 *   eye bones             local +X is FORWARD, local +Y is world -Y
 *
 * So on that rig `rotation.y` on the head is a ROLL, `rotation.x` is a yaw, and
 * the eyes do not even share the head's convention. Writing Euler components
 * directly would make the character tilt its head to look sideways.
 *
 * Instead each bound bone records the world up/right axes expressed in its own
 * PARENT's space, once, at bind time. Applying gaze is then a rotation about
 * those axes, which is correct for any rig regardless of how its local frames
 * are oriented — and costs two `setFromAxisAngle` calls per bone per frame.
 */

const BONE_CANDIDATES = {
  head: ["head", "mixamorighead", "bip01head", "cc_base_head"],
  neck: ["neck", "mixamorigneck", "bip01neck", "cc_base_neck"],
  spine: [
    "spine2",
    "spine1",
    "spine",
    "mixamorigspine1",
    "bip01spine2",
    "bip01spine1",
    "bip01spine",
    "cc_base_spine01",
  ],
  eyeLeft: [
    "lefteye",
    "eye_l",
    "mixamoriglefteye",
    "bip01leye",
    "cc_base_l_eye",
    "eyeleft",
  ],
  eyeRight: [
    "righteye",
    "eye_r",
    "mixamorigrighteye",
    "bip01reye",
    "cc_base_r_eye",
    "eyeright",
  ],
} as const;

type BoneKey = keyof typeof BONE_CANDIDATES;

/** Eyelid blendshapes, in the naming schemes we are likely to meet. */
const BLINK_MORPHS = [
  "eyeblinkleft",
  "eyeblinkright",
  "eyeblink_l",
  "eyeblink_r",
  "blink",
  "blinkleft",
  "blinkright",
  "blink_l",
  "blink_r",
  "eyesclosed",
  "eyes_closed",
];

/** Scene floor. Shared by the group's rest position and the breathing lift. */
const GROUND_Y = -0.95;

/**
 * REST POSE CORRECTION
 * ====================
 * A rigged model ships in its BIND pose. For this rig that is an A-pose with
 * the arms held out at about 45° — a modelling convention, not a way anyone
 * stands. It also spans 1.35 units across, which reaches past the left edge of
 * frame in a portrait tablet viewport.
 *
 * Bringing the arms down once, at bind time, costs nothing per frame, narrows
 * the silhouette to 0.66 units and is the difference between a mannequin and
 * someone standing. Angles are signed for the character's LEFT; the right arm
 * mirrors.
 */
const REST_ARM_POSE = {
  /** Upper arm, down from the bind pose. Leaves ~9° of natural outward hang. */
  upperArm: 0.558,
  /** A little elbow, so the arms do not read as locked straight. */
  forearm: 0.14,
} as const;

/** Arm bones, matched by the same rules as the gaze bones. */
const ARM_CANDIDATES = {
  leftUpper: ["bip01lupperarm", "leftarm", "mixamorigleftarm", "upperarm_l"],
  rightUpper: ["bip01rupperarm", "rightarm", "mixamorigrightarm", "upperarm_r"],
  leftFore: [
    "bip01lforearm",
    "leftforearm",
    "mixamorigleftforearm",
    "lowerarm_l",
  ],
  rightFore: [
    "bip01rforearm",
    "rightforearm",
    "mixamorigrightforearm",
    "lowerarm_r",
  ],
} as const;

interface BoundBone {
  object: Object3D;
  /** The bone's authored local rotation. Every offset is applied on top. */
  rest: Quaternion;
  /**
   * World up and world right, expressed in this bone's PARENT space. Rotating
   * about these yaws and pitches the bone no matter how its own local frame
   * happens to be oriented — see the axis note in the file header.
   */
  yawAxis: Vector3;
  pitchAxis: Vector3;
}

interface BoundMorph {
  mesh: Mesh;
  index: number;
}

/** A material we fade during the dissolve, plus its authored opacity. */
interface BoundMaterial {
  material: Material & { opacity: number; transparent: boolean };
  baseOpacity: number;
  baseTransparent: boolean;
}

interface Binding {
  bones: Partial<Record<BoneKey, BoundBone>>;
  morphs: BoundMorph[];
  materials: BoundMaterial[];
}

const normalise = (name: string): string =>
  name.toLowerCase().replace(/[\s_.:-]/g, "");

const WORLD_UP = new Vector3(0, 1, 0);
const WORLD_RIGHT = new Vector3(1, 0, 0);
const WORLD_FORWARD = new Vector3(0, 0, 1);

/**
 * Rotates a bone about a WORLD axis, on top of whatever it already holds.
 * Bind-time only — this allocates, and is never called from the frame loop.
 */
function poseBone(object: Object3D, worldAxis: Vector3, angle: number): void {
  const parentWorld = new Quaternion();
  if (object.parent) object.parent.getWorldQuaternion(parentWorld);

  const axis = worldAxis
    .clone()
    .applyQuaternion(parentWorld.invert())
    .normalize();

  object.quaternion.premultiply(new Quaternion().setFromAxisAngle(axis, angle));
  // Children read their parent's world matrix when they are posed in turn.
  object.updateMatrixWorld(true);
}

/**
 * Captures a bone's rest rotation and its gaze axes. Requires the subtree's
 * world matrices to be current, which `bind` guarantees.
 */
function boundBone(object: Object3D): BoundBone {
  const parentWorld = new Quaternion();
  if (object.parent) object.parent.getWorldQuaternion(parentWorld);
  // World → parent space. `invert` is in place, hence the fresh quaternion.
  const intoParent = parentWorld.invert();

  return {
    object,
    rest: object.quaternion.clone(),
    yawAxis: WORLD_UP.clone().applyQuaternion(intoParent).normalize(),
    pitchAxis: WORLD_RIGHT.clone().applyQuaternion(intoParent).normalize(),
  };
}

// Frame-loop scratch. Module scope because there is exactly one character and
// one frame loop, and this path must not allocate.
const spinQ = new Quaternion();
const tiltQ = new Quaternion();

/**
 * Applies gaze angles to a bone, on top of its rest pose.
 * `pitch` positive = looking up, `yaw` positive = toward scene +X — the
 * convention defined in src/animations/characterTracking.ts.
 */
function applyGaze(bone: BoundBone, pitch: number, yaw: number): void {
  spinQ.setFromAxisAngle(bone.yawAxis, yaw);
  tiltQ.setFromAxisAngle(bone.pitchAxis, -pitch);
  bone.object.quaternion.copy(spinQ).multiply(tiltQ).multiply(bone.rest);
}

function bind(root: Object3D): Binding {
  const byName = new Map<string, Object3D>();
  const morphs: BoundMorph[] = [];
  const materials: BoundMaterial[] = [];
  const seenMaterials = new Set<Material>();

  root.traverse((child) => {
    /* `useGLTF` caches by URL, so a remount re-binds the SAME objects — with
       the arms already posed and the bones wherever the last frame left them.
       Stashing the authored rotation on first sight and restoring it here
       makes bind idempotent: every pass starts from the pose the GLB shipped,
       so nothing stacks and no gaze offset is ever mistaken for a rest pose. */
    const authored = child.userData.authoredQuaternion as
      | Quaternion
      | undefined;
    if (authored) child.quaternion.copy(authored);
    else child.userData.authoredQuaternion = child.quaternion.clone();

    // First match wins, so a deeper duplicate cannot shadow the real bone.
    const key = normalise(child.name);
    if (!byName.has(key)) byName.set(key, child);

    const mesh = child as Mesh;

    // Collect every distinct material once, so a shared material is not faded
    // several times over in the same frame.
    if (mesh.material) {
      const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of list) {
        if (!material || seenMaterials.has(material)) continue;
        seenMaterials.add(material);
        const fadeable = material as BoundMaterial["material"];
        if (typeof fadeable.opacity !== "number") continue;
        materials.push({
          material: fadeable,
          baseOpacity: fadeable.opacity,
          baseTransparent: fadeable.transparent,
        });
      }
    }

    const dictionary = mesh.morphTargetDictionary;
    if (!dictionary || !mesh.morphTargetInfluences) return;

    for (const morphName of Object.keys(dictionary)) {
      if (!BLINK_MORPHS.includes(normalise(morphName))) continue;
      const index = dictionary[morphName];
      if (typeof index === "number") morphs.push({ mesh, index });
    }
  });

  // The authored pose is restored above, so world matrices are stale — and
  // poseBone/boundBone both read matrixWorld to resolve their axes.
  root.updateMatrixWorld(true);

  /* Stand the figure up before any rest pose is read off it. Upper arms are
     listed first, so each forearm is posed against an already-updated parent. */
  const armPose = [
    ["leftUpper", -REST_ARM_POSE.upperArm],
    ["rightUpper", REST_ARM_POSE.upperArm],
    ["leftFore", -REST_ARM_POSE.forearm],
    ["rightFore", REST_ARM_POSE.forearm],
  ] as const;

  for (const [key, angle] of armPose) {
    for (const candidate of ARM_CANDIDATES[key]) {
      const bone = byName.get(normalise(candidate));
      if (!bone) continue;
      poseBone(bone, WORLD_FORWARD, angle);
      break;
    }
  }

  const bones: Partial<Record<BoneKey, BoundBone>> = {};

  for (const key of Object.keys(BONE_CANDIDATES) as BoneKey[]) {
    for (const candidate of BONE_CANDIDATES[key]) {
      const match = byName.get(normalise(candidate));
      if (!match) continue;
      bones[key] = boundBone(match);
      break;
    }
  }

  return { bones, morphs, materials };
}

export interface CharacterModelProps {
  /** X position in the scene; set by HeroScene. */
  x?: number;
  /** Scale multiplier from the device quality budget. */
  scale?: number;
}

export function CharacterModel({ x = 0.75, scale = 1 }: CharacterModelProps) {
  const rig = useCharacterRig();
  const groupRef = useRef<Group>(null);

  const url = publicUrl(assets.character.model.path);
  const { scene } = useGLTF(url);

  const { bones, morphs, materials } = useMemo(() => bind(scene), [scene]);

  // Preallocated — nothing in the frame loop may allocate.
  const headWorld = useMemo(() => new Vector3(), []);
  const eyeWorld = useMemo(() => new Vector3(), []);

  // Last dissolve value written to the materials. Starts at -1 so the first
  // frame always applies, and thereafter nothing is touched while the value is
  // unchanged — which, with Phase 3B off, is every frame after the first.
  const lastDissolve = useRef(-1);

  useFrame(() => {
    const group = groupRef.current;
    const headBone = bones.head ?? bones.neck;

    /* ---------- Dissolve ----------
       The figure fades as the fragments carry it off. Once it is fully gone the
       whole subtree is hidden, so a transformed hero pays nothing to keep an
       invisible character in the draw list. */
    const { dissolve } = rig.transform;
    if (group) {
      group.visible = dissolve < 0.999;
      if (!group.visible) return;
    }

    if (dissolve !== lastDissolve.current) {
      lastDissolve.current = dissolve;
      const fading = dissolve > 0.001;
      for (const entry of materials) {
        // Reassigning `transparent` can force a shader recompile, so it is only
        // ever written when the dissolve state actually changes.
        entry.material.transparent = fading ? true : entry.baseTransparent;
        entry.material.opacity = fading
          ? entry.baseOpacity * (1 - dissolve)
          : entry.baseOpacity;
      }
    }

    /* ---------- Whole body ----------
       The slowest of the character's own layers. With no head bone at all this
       is also the fallback gaze (tier 3), held to the head's limits. */
    if (group) {
      if (headBone) {
        group.rotation.x = -rig.body.pitch;
        group.rotation.y = rig.body.yaw;
      } else {
        group.rotation.x = -rig.head.pitch;
        group.rotation.y = rig.head.yaw;
      }
      // Breathing lift, scaled with the figure so it stays proportional.
      group.position.y =
        GROUND_Y + rig.breath * idleBehaviour.breathLift * scale;
    }

    /* ---------- Head ---------- */
    if (headBone) {
      applyGaze(headBone, rig.head.pitch, rig.head.yaw);
    }

    /* ---------- Spine ----------
       Carries half the body yaw plus the breath, so the twist is distributed
       up the torso instead of pivoting at the hips. */
    if (bones.spine) {
      applyGaze(
        bones.spine,
        rig.breath * idleBehaviour.breathPitch,
        rig.body.yaw * 0.5,
      );
    }

    /* ---------- Eyes ----------
       Both eyes converge on one point rather than sharing one rotation. The
       look point is taken from the head, then each eye adds the vergence its
       own lateral offset requires — so the near eye turns slightly further,
       which is what reads as a pair of eyes rather than two swivelling balls. */
    if (headBone && (bones.eyeLeft || bones.eyeRight)) {
      headBone.object.getWorldPosition(headWorld);
      const targetZ = headWorld.z + rig.look.z;

      for (const eye of [bones.eyeLeft, bones.eyeRight]) {
        if (!eye) continue;

        eye.object.getWorldPosition(eyeWorld);
        // Offset from the head's centre line — NOT from the target. This is
        // the inter-pupillary half-distance, a few millimetres, which is why
        // the correction stays in the hundredths of a radian.
        const lateral = eyeWorld.x - headWorld.x;
        const forward = targetZ - eyeWorld.z;

        const verge = clamp(
          vergenceYaw(lateral, forward),
          -gazeGeometry.maxVergence,
          gazeGeometry.maxVergence,
        );

        applyGaze(eye, rig.eyes.pitch, rig.eyes.yaw + verge);
      }
    }

    /* ---------- Blink ----------
       Only ever touches blendshapes the model actually author-shipped. */
    for (const morph of morphs) {
      const influences = morph.mesh.morphTargetInfluences;
      if (influences) influences[morph.index] = rig.blink;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[x, GROUND_Y, 0]}
      scale={scale}
      dispose={null}
    >
      <primitive object={scene} />
    </group>
  );
}

export default CharacterModel;
