# models/

**Status: no model supplied.** The 3D character architecture is complete and
verified, but the character slot is empty and renders nothing. This file is the
spec for the asset that fills it.

## Where it goes

```
public/models/character.glb
```

Then flip the flags — nothing else in the codebase has to change:

1. `src/config/assets.ts` → `character.model.ready = true`
2. `src/config/site.ts` → `features.character3D = true`
3. `src/config/site.ts` → `features.heroTransformation = true` (Phase 3B: the
   human → AI transformation and the technology orbit)

Until the first two are true the GLB parser is never even downloaded:
`CharacterModel` is a lazy chunk (~74 kB) gated behind that pair. The orbit and
its brand marks are a second lazy chunk (~17 kB), loaded only once the hero
actually reaches the AI state.

`heroTransformation` is separate because the sequence is meant to *open* on the
3D character. With no model it would dissolve a portrait into the same portrait,
which is not the story — so it waits for this file to exist.

## Required characteristics

| Requirement | Target |
| --- | --- |
| Subject | Realistic human. Not stylised, cartoon, anime, or a gaming avatar |
| Appearance | Professional — reads as an AI/ML engineer, not a sci-fi character |
| Clothing | Neutral and professional. No armour, no costume, no glowing panels |
| Pose | Seated or standing naturally, facing roughly toward camera (+Z) |
| Face | Clearly visible, with enough facial geometry to hold up at close range |
| Format | GLB (preferred) or GLTF, Y-up, metres, origin at the feet |
| Size | Under ~8 MB — Draco or meshopt compressed, textures baked to 1–2k |
| Topology | Web-reasonable: roughly 30–80k triangles |
| Animation | None required. Remove unused tracks — the rig is driven procedurally |

### Rig — in order of preference

The binder degrades gracefully, so any of these three will work. The higher the
tier, the better the result:

1. **Eye bones + head/neck bone** — full gaze: converged eyes, head follows.
2. **Head/neck bone only** — subtle head tracking, no eye movement.
3. **Neither** — a clamped rotation on the root group. Functional, but the
   weakest of the three.

**Eyelid blendshapes** are optional and separate. If the model ships any of
`eyeBlinkLeft` / `eyeBlinkRight` / `blink` / `eyesClosed` (ARKit or Mixamo
naming), blinking turns on automatically. Without them the character simply does
not blink — nothing fakes it by deforming the face.

### Bone naming

Names are matched case-insensitively with separators stripped, so Mixamo, Ready
Player Me, Character Creator and Blender defaults all bind with no changes. A
rig using different names needs one entry added to `BONE_CANDIDATES` in
`src/components/Character/CharacterModel.tsx` — that is the only edit required.

## What is already built and waiting

| File | Role |
| --- | --- |
| `src/components/Character/CharacterRig.tsx` | Cursor → eyes → head → body hierarchy, damping, clamps, idle layer |
| `src/components/Character/CharacterModel.tsx` | Bone/blendshape binding and per-frame application |
| `src/components/Character/CharacterLoader.tsx` | Suspense + error boundary, so a bad GLB cannot break the hero |
| `src/components/Character/CharacterPlaceholder.tsx` | Grey-box stand-in for inspecting the rig (`features.characterPlaceholder`) |
| `src/animations/characterTracking.ts` | The gaze maths: angles, vergence, breathing, blink |
| `src/config/site.ts` | `rigLimits`, `rigDamping`, `gazeGeometry`, `idleBehaviour`, `characterScale` |

## After dropping the model in

Check, in this order:

1. The figure sits at `sceneLayout.characterXBesidePortrait` and does not cover
   the headline, navbar or CTAs at 1280px, 1440px and 1920px.
2. Scale: adjust `qualityBudgets.*.characterScale` if the model's own height
   differs from the ~1.8 unit placeholder.
3. Gaze direction. If the eyes track *away* from the cursor, the rig's forward
   axis is -Z rather than +Z — rotate the model 180° in the GLB rather than
   negating signs in the code, so the one documented convention stays true.
4. Vergence: confirm the eyes converge rather than diverging. If the model's eye
   bones are mirrored, `gazeGeometry.maxVergence` will clamp the error but the
   convergence will read inverted.
5. Blink, if the blendshapes exist.
6. Frame rate with `shadows: true` on the high tier.

## Phase 3B — once the model is in and the transformation is on

The sequence is `human → activating → transforming → ai`, driven by one number
(`progress`) that every visual reads from. Check:

1. The dissolve fragments spawn around the figure, not beside it. The volume is
   a 1.82-unit column — if the model's height differs, adjust the `position`
   generation in `src/components/three/AiTransformation.tsx`.
2. The light sweep crosses the figure vertically rather than passing through
   empty space.
3. The character is ~88% gone by the time the AI portrait reaches half opacity.
   That crossover is the whole effect; if it reads as a cut, retune
   `heroStages` in `src/config/site.ts`.
4. The orbit enters only after the portrait is dominant, and the eight icons
   clear the headline and the CTAs at 1280px and 1440px.
