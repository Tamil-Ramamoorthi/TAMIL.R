# TAMIL R — Interactive AI/ML Portfolio

Personal portfolio for **Tamil Ramamoorthi** — AI / ML Engineer.

React + TypeScript + Vite, with Three.js (React Three Fiber) for the hero scene
and GSAP for orchestrated motion. No router, no backend, no database.

> **Status: Phase 1 — production foundation.**
> The cursor-driven hero reveal and the final 3D character are deliberately
> **not** implemented. Both are gated behind flags in `src/config/site.ts`.

---

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve dist/ at http://localhost:4173
npm run typecheck  # tsc --noEmit
```

Deploying under a sub-path (e.g. GitHub Pages project site):

```bash
VITE_BASE=/portfolio/ npm run build
```

Every runtime asset path goes through `publicUrl()` in `src/config/assets.ts`,
so changing the base never breaks asset loading.

---

## How the architecture works

### Content is data, not markup

All portfolio content lives in `src/data/`. Components consume structured data
and never hardcode copy. Update a project, skill or achievement there and the
UI follows — no component changes.

```
src/data/
├── personal.ts      identity, summary, social links, languages
├── skills.ts        technology groups (only populated groups render)
├── services.ts      "What I Do" capability areas
├── projects.ts      project ledger + screenshot slots
├── experience.ts    internships
├── education.ts     degree
├── achievements.ts  topper / publication / hackathon
└── index.ts         barrel — components import from here
```

### Assets are declared once

`src/config/assets.ts` is the only place a filename appears. Each asset is an
`AssetRef` with a `ready` flag:

```ts
hero: {
  clean: asset('image', 'images/hero-clean.jpg', 'Hero — clean portrait'),
}
```

While `ready` is `false`, `<AssetImage>` renders `<AssetPlaceholder>` — a dashed
frame naming the expected file. Nothing is faked, and nothing 404s.

### Structure and gating

`src/config/site.ts` holds the section registry (ids, numbering, nav order),
the **feature flags**, device quality budgets and the rig damping constants.

```ts
features = {
  heroReveal: false,   // Phase 2 — cursor-driven organic reveal
  character3D: false,  // Phase 2 — real GLB character
  hdrLighting: false,  // needs a real .hdr
  particles: true,
  customCursor: true,
  projectDetail: true,
}
```

### Mouse movement never re-renders React

`src/hooks/pointerStore.ts` is a module-level store with one set of window
listeners. It mutates a single state object; consumers (cursor, character rig,
the future reveal mask) read it inside their own `rAF` / `useFrame` loop and
interpolate towards it. `subscribePointer()` coalesces to one call per frame
and is used only where React genuinely needs to know.

### The interaction hierarchy

`src/components/Character/CharacterRig.tsx` implements:

```
cursor → eyes → head → body → environment
```

One `useFrame` damps four layers towards the same pointer target at different
rates (`rigDamping`) within per-layer limits (`rigLimits`). Damping is
frame-rate independent, so it behaves the same at 60Hz and 144Hz. The camera,
workspace and particles are the outer layers of this same rig.

### Motion is orchestrated, not scattered

`src/animations/` holds timeline factories, not per-component tweens. Each one
takes elements, returns a timeline or cleanup function, and applies the **final
state immediately** when motion is disabled.

`booted` in `App.tsx` is the single piece of global state: it flips when the
preloader finishes and releases the hero entrance, navbar entrance, scroll
reveals and the WebGL canvas as one sequence.

### Accessibility and graceful degradation

- Hidden pre-animation states apply only under `html.anim-ready`, which
  `main.tsx` adds **only** when motion is allowed. Without JS, or with
  `prefers-reduced-motion`, every element renders visible.
- `prefers-reduced-motion` also disables the custom cursor and eye/head
  tracking, and drops the scene to `frameloop="demand"` (one frame, then idle).
- Without WebGL the hero shows a real CSS backdrop, not an error.
- Skip link, focus-visible rings, keyboard-operable accordion and carousel,
  `aria-expanded` / `aria-current` / `inert` where appropriate.

### Performance

- three.js and the R3F layer are lazily imported — the first paint pays for
  React + GSAP + app code only.
- `GLTFLoader` (73 kB) and the HDR loader (51 kB) are separate chunks, fetched
  only if a model / HDR actually exists.
- Device pixel ratio, antialiasing, shadows and particle count all come from
  the quality tier (`high` / `medium` / `low`) picked by
  `useDeviceCapabilities`, which also writes `data-quality` on `<html>` so CSS
  can drop backdrop filters and grain on weak devices.
- `AdaptiveDpr` reduces resolution further if frames drop.
- Images below the fold are lazy; scroll reveals are batched ScrollTriggers.

---

## Adding the real assets

### 1. The 3D character

1. Export GLB/GLTF to `public/models/character.glb`
   (draco/meshopt compressed, textures baked to 1–2k, under ~8 MB).
2. `src/config/assets.ts` → `character.model.ready = true`
3. `src/config/site.ts` → `features.character3D = true`

Bones are matched case-insensitively in `CharacterModel.tsx`; Mixamo, Ready
Player Me and Blender naming are already covered. Add yours to
`BONE_CANDIDATES` if the rig differs. Rotations are applied as offsets on the
rest pose, so proportions and existing animations survive.

### 2. The clean / futuristic hero images

1. `public/images/hero-clean.jpg` and `public/images/hero-ai.jpg`
2. Flip both `ready` flags in `src/config/assets.ts`

**They must be identical in dimensions, crop and framing.** The Phase 2 reveal
moves only a mask — neither image is ever scaled, moved or rotated — so any
mismatch will be visible.

### 3. Project screenshots

One folder per project, named with the project `id`:

```
public/images/projects/caregpt-ai/01-dashboard.jpg
```

Expected filenames are declared in `src/data/projects.ts`. Mark one supplied by
passing `true` to `projectShot`:

```ts
projectShot('caregpt-ai', '01-dashboard.jpg', 'Dashboard', true)
```

### 4. Resume

1. `public/resume/Tamil-Ramamoorthi-Resume.pdf`
2. `src/config/assets.ts` → `resume.ready = true`

The navbar button and contact link both read that one entry and stay disabled
until it is ready.

### 5. Social links

`socials` in `src/data/personal.ts`. One array, consumed by the mobile menu and
the contact grid.

---

## What is intentionally blank

These render as labelled placeholders rather than invented content:

| Field | Where |
| --- | --- |
| Hero positioning statement | `personal.heroStatement` |
| Project `problem` / `solution` | `src/data/projects.ts` |
| Project GitHub / live-demo URLs | `src/data/projects.ts` |
| Project `status` | `src/data/projects.ts` |
| Internship responsibilities | `experience[].points` |
| All image / model / resume files | `src/config/assets.ts` |

Project `description` fields are factual restatements of the title, subtitle and
stack supplied — review the wording and replace with your own.
