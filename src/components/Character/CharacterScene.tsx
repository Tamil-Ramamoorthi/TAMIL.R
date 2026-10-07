import { lazy } from "react";
import { assets } from "../../config/assets";
import { features } from "../../config/site";
import { CharacterLoader } from "./CharacterLoader";
import { CharacterPlaceholder } from "./CharacterPlaceholder";

/**
 * CHARACTER SCENE
 * ===============
 * The swap point between nothing, the grey-box placeholder and the real model.
 *
 *   character3D = false, characterPlaceholder = false   →  nothing (shipping)
 *   character3D = false, characterPlaceholder = true    →  grey box (dev)
 *   character3D = true,  model.ready = true             →  the real character
 *
 * The two flags are deliberately independent. `character3D` is the real
 * feature; `characterPlaceholder` is a development aid for inspecting the gaze
 * hierarchy without a model. Neither blocks the other, and the shipping
 * default renders no character at all — a blocked-out volume is scaffolding,
 * not a portfolio visual.
 *
 * TO ADD THE FINAL CHARACTER
 * --------------------------
 *   1. Put the file at `public/models/character.glb`.
 *   2. In src/config/assets.ts set `character.model.ready = true`.
 *   3. In src/config/site.ts set `features.character3D = true`.
 *
 * The loader is code-split, so the GLB parser is never downloaded until both
 * of those are true.
 */
const CharacterModel = lazy(() => import("./CharacterModel"));

/**
 * Whether anything will be rendered in the character slot. HeroScene uses this
 * to decide whether to draw the contact shadow, which would otherwise sit on
 * the floor under nobody.
 */
export function isCharacterActive(): boolean {
  return (
    (features.character3D && assets.character.model.ready) ||
    features.characterPlaceholder
  );
}

export interface CharacterSceneProps {
  /** X position in the scene; set by HeroScene. */
  x?: number;
  /** Scale multiplier from the device quality budget. */
  scale?: number;
}

export function CharacterScene({ x, scale }: CharacterSceneProps) {
  const useRealModel = features.character3D && assets.character.model.ready;

  // The grey box doubles as the loading and failure state when it is enabled,
  // so a dev inspecting the rig sees the slot either way.
  const placeholder = features.characterPlaceholder ? (
    <CharacterPlaceholder x={x} scale={scale} />
  ) : null;

  if (!useRealModel) return placeholder;

  return (
    <CharacterLoader fallback={placeholder}>
      <CharacterModel x={x} scale={scale} />
    </CharacterLoader>
  );
}
