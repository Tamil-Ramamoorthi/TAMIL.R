/**
 * SITE CONFIGURATION
 * ==================
 * Structural, non-content configuration: section registry, feature gates and
 * device/quality budgets. Portfolio *content* lives in `src/data/`.
 */

/* ==========================================================================
   SECTIONS
   The single source of truth for section ids, order and numbering. The navbar,
   mobile menu, scroll-spy and <MainContainer> all read from this list, so
   adding a section means adding one entry here.
   ========================================================================== */

export type SectionId =
  | 'hero'
  | 'about'
  | 'what-i-do'
  | 'tech-stack'
  | 'projects'
  | 'experience'
  | 'education'
  | 'achievements'
  | 'contact';

export interface SectionMeta {
  readonly id: SectionId;
  /** Zero-padded ordinal shown in section headers, e.g. "02". */
  readonly index: string;
  /** Full section title. */
  readonly title: string;
  /** Short label used in navigation; omitted sections are not linked. */
  readonly navLabel?: string;
  readonly inNav: boolean;
}

export const sections: readonly SectionMeta[] = [
  { id: 'hero', index: '01', title: 'Hero', inNav: false },
  { id: 'about', index: '02', title: 'About', navLabel: 'About', inNav: true },
  {
    id: 'what-i-do',
    index: '03',
    title: 'What I Do',
    navLabel: 'Work',
    inNav: false,
  },
  {
    id: 'tech-stack',
    index: '04',
    title: 'Tech Stack',
    navLabel: 'Skills',
    inNav: true,
  },
  {
    id: 'projects',
    index: '05',
    title: 'Projects',
    navLabel: 'Work',
    inNav: true,
  },
  {
    id: 'experience',
    index: '06',
    title: 'Experience',
    navLabel: 'Experience',
    inNav: true,
  },
  { id: 'education', index: '07', title: 'Education', inNav: false },
  {
    id: 'achievements',
    index: '08',
    title: 'Achievements & Research',
    inNav: false,
  },
  {
    id: 'contact',
    index: '09',
    title: 'Contact',
    navLabel: 'Contact',
    inNav: true,
  },
];

const sectionMap = new Map(sections.map((s) => [s.id, s]));

export function getSection(id: SectionId): SectionMeta {
  const meta = sectionMap.get(id);
  if (!meta) throw new Error(`Unknown section id: ${id}`);
  return meta;
}

/**
 * Explicit navbar order. Kept separate from section order so the menu can read
 * the way a visitor expects (work before skills) while the page still runs in
 * its numbered sequence.
 */
export const navOrder: readonly SectionId[] = [
  'about',
  'projects',
  'tech-stack',
  'experience',
  'contact',
];

export const navSections: readonly SectionMeta[] = navOrder.map(getSection);

/* ==========================================================================
   FEATURE GATES
   Phase 2+ features stay switched off here until they are actually built, so
   partial work can land without shipping a half-finished interaction.
   ========================================================================== */

export const features = {
  /** Cursor-driven organic reveal of the futuristic identity. Phase 2C. */
  heroReveal: true,
  /**
   * The real rigged GLB character.
   *
   * OFF. The hero's interactive object is now the AI tracker, not a human
   * figure — a perception core reads as an AI engineer's portfolio where a
   * stock business avatar did not, and it costs a few hundred triangles
   * instead of a 3.86 MB download.
   *
   * The Character architecture is intact and still typechecks; only this flag
   * disconnects it from the render path, so the figure can be brought back by
   * flipping it. `assets.character.model` has also been dropped from
   * `lazyAssets`, so the GLB is no longer fetched while the flag is off.
   */
  character3D: false,
  /**
   * The grey-box stand-in used to prove the rig without a model.
   *
   * Off by default and deliberately NOT tied to `character3D`: a blocked-out
   * volume is a development aid, not a visual the portfolio should ship.
   */
  characterPlaceholder: false,
  /**
   * Phase 3B — the staged human → AI transformation, and the technology orbit
   * that follows it.
   *
   * ON as of Phase 3E. The character landed in 3D, `character3D` is on, and
   * the figure it dissolves is now a real person rather than a portrait fading
   * into itself — which is the whole point of the sequence.
   *
   * The dissolve volume in AiTransformation is a 1.82-unit column and the
   * model stands 1.8102 units, so the fragments spawn around the figure with
   * no retuning. Choreography (`heroStages`) is unchanged from Phase 3B.
   */
  heroTransformation: true,
  /** HDR environment lighting — only worth it once a real HDR is supplied. */
  hdrLighting: false,
  /** Ambient particle field in the hero scene. */
  particles: true,
  /** Custom cursor on fine-pointer devices. */
  customCursor: true,
  /** Expandable project detail rows. */
  projectDetail: true,
} as const;

/* ==========================================================================
   DEVICE / QUALITY BUDGETS
   ========================================================================== */

export type QualityTier = 'high' | 'medium' | 'low';

export interface QualityBudget {
  /** Upper bound for the renderer's device pixel ratio. */
  readonly maxDpr: number;
  readonly antialias: boolean;
  readonly shadows: boolean;
  readonly particleCount: number;
  /** Ceiling for cursor-reactive movement, in scene units. */
  readonly parallax: number;
  /**
   * Multiplier on the character's scale. Reduced on narrower viewports so the
   * figure never grows into the headline or the CTAs.
   */
  readonly characterScale: number;
  /** Technology icons visible in the orbit. */
  readonly orbitCount: number;
  /** Tracking nodes orbiting the AI tracker core. */
  readonly trackerNodes: number;
  /** Extra points spawned for the dissolve, on top of the ambient field. */
  readonly dissolveParticles: number;
}

export const qualityBudgets: Record<QualityTier, QualityBudget> = {
  high: {
    maxDpr: 2,
    antialias: true,
    shadows: true,
    particleCount: 420,
    parallax: 1,
    characterScale: 1,
    orbitCount: 10,
    trackerNodes: 9,
    dissolveParticles: 900,
  },
  medium: {
    maxDpr: 1.5,
    antialias: true,
    shadows: false,
    particleCount: 200,
    parallax: 0.65,
    characterScale: 0.76,
    orbitCount: 8,
    trackerNodes: 6,
    dissolveParticles: 420,
  },
  low: {
    maxDpr: 1,
    antialias: false,
    shadows: false,
    particleCount: 90,
    parallax: 0.35,
    characterScale: 0.58,
    orbitCount: 5,
    trackerNodes: 4,
    dissolveParticles: 180,
  },
};

/** Viewport breakpoints, mirroring the media queries in `src/styles`. */
export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 992,
  xl: 1280,
} as const;

/* ==========================================================================
   INTERACTION RIG
   Damping factors for the cursor → character → environment hierarchy.
   Lower = slower to catch up. Eyes react fastest, environment slowest.
   ========================================================================== */

export const rigDamping = {
  eyes: 0.18,
  head: 0.075,
  body: 0.035,
  environment: 0.014,
} as const;

/**
 * Maximum gaze each rig layer may apply, in radians.
 *
 * `pitch` is up/down, `yaw` is left/right — see src/animations/characterTracking.ts
 * for the sign convention. These are hard ceilings: the summed target
 * (cursor + idle settle) is clamped to them before damping, so no combination
 * of inputs can over-rotate a neck.
 *
 * The ordering is the whole interaction: eyes get the widest budget, the head
 * roughly half of it, and the body barely moves at all.
 */
export const rigLimits = {
  eyes: { pitch: 0.26, yaw: 0.4 },
  head: { pitch: 0.14, yaw: 0.26 },
  body: { pitch: 0.05, yaw: 0.1 },
  environment: { pitch: 0.03, yaw: 0.06 },
} as const;

/**
 * GAZE GEOMETRY
 * Maps the normalised pointer (-1..1 across the hero) onto a point in scene
 * space for the character to look at. Angles are then derived from that point
 * geometrically, rather than scaling the pointer value straight into a
 * rotation — which is what lets two eyes converge on one spot.
 */
export const gazeGeometry = {
  /** Half-width of the plane the cursor is projected onto, in scene units. */
  reachX: 2.1,
  reachY: 1.25,
  /** How far in front of the character that plane sits (towards the camera). */
  distance: 2.4,
  /** Ceiling on the per-eye convergence correction, in radians. */
  maxVergence: 0.08,
} as const;

/**
 * IDLE LAYER
 * Deliberately tiny. The aim is "a person who is not a statue", not an
 * animation — so the settle amplitudes are a few percent of the gaze limits,
 * and nothing here runs under `prefers-reduced-motion`.
 */
export const idleBehaviour = {
  /** Settle amplitude as a fraction of each layer's limit. */
  settleOver: 0.05,
  settleAway: 0.1,
  /** Breaths per second — about 13 per minute, a resting rate. */
  breathRate: 0.22,
  /** Vertical chest lift at full inhale, in scene units. */
  breathLift: 0.007,
  /** Spine pitch at full inhale, in radians. */
  breathPitch: 0.007,
  blink: {
    minInterval: 2.9,
    maxInterval: 6.4,
    closeDuration: 0.085,
    openDuration: 0.13,
  },
} as const;

/* ==========================================================================
   SCENE COMPOSITION
   Where the character stand-in sits along X. When the real hero portrait
   occupies the right-hand column, the character moves left to the workstation
   so the two never compete for the same part of the frame.
   ========================================================================== */

export const sceneLayout = {
  characterX: 0.75,
  characterXBesidePortrait: -0.35,
  /**
   * Where the AI tracker idles, in scene units.
   *
   * Right of centre and above the midline: that is the gap between the
   * headline block at the lower left and the portrait column on the right, so
   * the tracker bridges the two without overlapping either. It is pushed back
   * on Z so it sits behind the plane the portrait occupies.
   */
  tracker: [0.95, 0.5, -0.6] as [number, number, number],
} as const;

/* ==========================================================================
   AI TRACKER
   The hero's interactive object. Values are tuned to read as attentive
   rather than eager — see src/components/three/AITracker.tsx.
   ========================================================================== */

export const trackerBehaviour = {
  /** How far the tracker travels from its idle point, in scene units. */
  reach: 0.85,
  /**
   * Damping towards the cursor. Deliberately slower than the rig's own gaze
   * damping — the difference between the two rates is the inertia.
   */
  follow: 2.1,
  /** Damping on the attention value, so brightness never flickers. */
  focusDamp: 3.5,
  /** NDC distance within which the pointer counts as near the tracker. */
  focusRadius: 0.55,
  /** Ring revolutions per second: idle, and the extra at full attention. */
  idleSpin: 0.12,
  focusSpin: 0.3,
  /** How far nodes draw inward at full attention, as a fraction of radius. */
  converge: 0.22,
  /** Seconds between scan pulses. Slow on purpose: a check-in, not a radar. */
  scanPeriod: 7.5,
} as const;

/* ==========================================================================
   HERO TRANSFORMATION  (Phase 3B)
   The human → AI sequence. One timeline drives one number; every visual reads
   from it, so the stages can never disagree about where the transformation is.
   ========================================================================== */

/**
 * Phases, in order. Strictly forward — `activate()` is the only entry point and
 * the sequence never reverses on its own, so the hero cannot flicker between
 * identities.
 */
export type HeroPhase = 'human' | 'activating' | 'transforming' | 'ai';

export const heroTransformation = {
  /**
   * Dwell between the interaction and the dissolve starting. Long enough that
   * the transformation reads as a response to the visitor rather than a
   * coincidence, short enough not to feel broken.
   */
  activateDelay: 0.4,
  /** The dissolve itself. Inside the 1.2–1.8s the brief asks for. */
  duration: 1.5,
} as const;

/**
 * Where each visual lives along the 0..1 progress value. These windows are the
 * whole choreography, and they overlap only where the brief asks them to — the
 * character is still fading while the portrait starts arriving, so the two
 * cross rather than cutting.
 *
 * Read the second column as "nothing happens before this".
 */
export const heroStages = {
  /** AI signals: particles, blue light. First thing to move. */
  signal: { from: 0, to: 0.3 },
  /**
   * Light sweep across the character. It is the CAUSE of the dissolve, so it
   * leads it and is finished before the portrait starts arriving — otherwise
   * the sweep, the dissolve and the portrait are all mid-flight at once, which
   * is exactly the "everything moves together" the brief rules out.
   */
  sweep: { from: 0.1, to: 0.5 },
  /** Character dissolving into fragments. */
  dissolve: { from: 0.22, to: 0.86 },
  /** Fragment density, a bell peaking mid-dissolve. */
  burstPeak: 0.56,
  /**
   * AI portrait rising to dominance. Starts late enough that the sweep has
   * cleared, but still well inside the dissolve, so the two cross instead of
   * cutting — the character is ~88% gone when the portrait hits half.
   */
  portrait: { from: 0.48, to: 0.96 },
} as const;

/* ==========================================================================
   TECHNOLOGY ORBIT
   ========================================================================== */

/**
 * One orbital layer. Three of them stack into the satellite system: radii,
 * speed, plane angle and direction all differ, so nothing ever moves in
 * lockstep and the group reads as depth rather than as one spinning dial.
 *
 * Radii are fractions of the PORTRAIT FRAME WIDTH, so the whole system scales
 * with the portrait at every breakpoint without a single media query. Which
 * technology rides on which layer, and where it starts, is data — see
 * `orbitTechnologies` in `src/data/technologies.ts`.
 */
export interface OrbitRing {
  readonly id: 'inner' | 'middle' | 'outer';
  readonly radiusX: number;
  readonly radiusY: number;
  /** Seconds for one full revolution. */
  readonly period: number;
  /** +1 clockwise, -1 counter-clockwise. Mixing them kills any shear pattern. */
  readonly direction: 1 | -1;
  /**
   * The orbital plane's own rotation, in degrees. Small on purpose — this is
   * what stops three concentric ellipses from looking like a target. Applied
   * to the PATH only; see the upright guarantee in TechnologyOrbit.tsx.
   */
  readonly tiltDeg: number;
  /** Icon size multiplier. Outer marks are marginally smaller. */
  readonly scale: number;
  /** How strongly this layer answers the cursor. Outer leans most. */
  readonly lean: number;
}

export const orbitLayout = {
  /* ---------- Where the system is centred ----------
     Offsets from the PORTRAIT centre, as fractions of the frame width.

     `centreY` is the portrait-protection invariant and the single most
     important number here. The near half of every orbit — the half that paints
     IN FRONT of the portrait — can never rise above this line, and the chin in
     `hero-clean.jpg` measures at about +0.08w below the frame centre. The
     near arc only reaches +0.17w at its far left and right ends, well outside
     the face, and across the face it runs far lower, over the collar and the
     tie, never the mouth, nose, eyes or hair, with room to spare for the
     icon's own radius and for the plane angles below. The far half passes BEHIND the portrait, which is
     opaque, so it is occluded rather than drawn over the face.

     `centreX` pulls the system slightly left, into the open space between the
     headline and the portrait column, which is also what keeps the widest
     orbit clear of the right viewport edge. ------------------------------- */
  centreX: -0.1,
  centreY: 0.17,

  /** The three layers, inner → outer. */
  rings: [
    {
      id: 'inner',
      radiusX: 0.55,
      radiusY: 0.42,
      period: 21,
      direction: 1,
      tiltDeg: -6,
      scale: 1,
      lean: 0.6,
    },
    {
      id: 'middle',
      radiusX: 0.64,
      radiusY: 0.56,
      period: 27,
      direction: -1,
      tiltDeg: 5,
      scale: 0.94,
      lean: 0.85,
    },
    {
      id: 'outer',
      radiusX: 0.73,
      radiusY: 0.7,
      period: 34,
      direction: 1,
      tiltDeg: -6,
      scale: 0.88,
      lean: 1.15,
    },
  ] as const satisfies readonly OrbitRing[],

  /**
   * Floor on the automatic fit scale. `measure()` shrinks every radius until
   * the widest orbit clears the viewport, so phones and short laptops never
   * push an icon off-screen; this stops that shrink from ever pulling the
   * orbits in tight around the face.
   */
  minFit: 0.55,

  /** Pointer distance, in px, within which an icon becomes focused. */
  focusRadius: 74,
  /**
   * Peak drift, in px, of a focused icon toward the pointer. A few pixels of
   * attention — enough to feel the node notice you, never enough to chase.
   */
  focusPull: 5,
  /**
   * Radius multiplier on tablet widths. The portrait column is narrower there
   * relative to the headline, so the system draws in a little tighter on top
   * of the viewport fit that `measure()` already applies.
   */
  tabletRadius: 0.88,
  /** Individual vertical float, in px. */
  floatAmplitude: 6,

  /* ---------- Depth shaping ----------
     Driven by the orbital angle, not by a fixed per-icon value: an icon swells
     and brightens as it comes round the near side and settles back as it goes
     behind. The floors are deliberately high — an icon is never hidden by its
     own depth, only ever by the portrait standing in front of it. */
  scaleNear: 1,
  scaleFar: 0.78,
  opacityNear: 1,
  opacityFar: 0.46,
  /** Per-icon idle shimmer: turns per second, and its weight on brightness. */
  shimmerRate: 0.085,
  shimmerDepth: 0.18,

  /* ---------- Cursor tilt ----------
     The whole system leans toward the pointer. It is a parallax shift of the
     entire rig, not per-icon chasing: every orbit keeps its shape and spacing,
     so it still reads as one stable object that happens to be paying
     attention. ------------------------------------------------------------ */

  /** Peak lean, as a fraction of the orbit radius. */
  tilt: 0.085,
  /** Degrees the guide rings lean at full tilt. */
  tiltRotate: 4,
  /** Per-frame easing on the tilt. Low = heavy, unhurried. */
  tiltDamp: 0.05,
} as const;

/* ==========================================================================
   PRELOADER
   ========================================================================== */

export const preloader = {
  /** Keeps the intro from flashing on a warm cache. */
  minDurationMs: 850,
  /** Hard ceiling — the site is never gated behind a slow asset. */
  maxDurationMs: 4500,
} as const;
