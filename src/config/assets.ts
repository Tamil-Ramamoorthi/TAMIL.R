/**
 * ASSET ARCHITECTURE
 * ==================
 * Every binary asset the site can use is declared exactly once, here.
 * Components never hardcode a filename — they import an `AssetRef` and hand it
 * to `resolveAsset()` (for a URL) or to `<AssetImage />` / `<AssetPlaceholder />`
 * (which renders labelled scaffolding while the real file is missing).
 *
 * TO ADD A REAL ASSET
 * -------------------
 *  1. Drop the file at the `path` shown below, inside `public/`.
 *  2. Flip that entry's `ready` flag to `true`.
 * Nothing else in the codebase has to change.
 *
 * Paths are declared WITHOUT a leading slash and resolved against
 * `import.meta.env.BASE_URL`, so the site keeps working when deployed under a
 * sub-directory (set VITE_BASE at build time).
 */

export type AssetKind = 'image' | 'model' | 'hdr' | 'document' | 'texture';

export interface AssetRef {
  /** Path inside `public/`, with no leading slash. */
  readonly path: string;
  /** `false` until the real file has been supplied — drives placeholders. */
  readonly ready: boolean;
  /** Short human label used by placeholder scaffolding. */
  readonly label: string;
  readonly kind: AssetKind;
  /** Required for images that carry meaning. */
  readonly alt?: string;
  /**
   * CSS `object-position` for images rendered in a fixed-ratio frame.
   * This is the focal point: set it so the subject survives the crop at every
   * breakpoint. Defaults to a face-safe "50% 22%" when omitted.
   */
  readonly focus?: string;
}

/** Declares an asset slot. Defaults to not-ready so nothing is ever faked. */
function asset(
  kind: AssetKind,
  path: string,
  label: string,
  options: { ready?: boolean; alt?: string; focus?: string } = {},
): AssetRef {
  return {
    kind,
    path,
    label,
    ready: options.ready ?? false,
    ...(options.alt ? { alt: options.alt } : {}),
    ...(options.focus ? { focus: options.focus } : {}),
  };
}

/** Prefixes the deploy base path. Safe to call with an already-absolute URL. */
export function publicUrl(path: string): string {
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path;
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

/** Resolved URL for an asset, or `null` when the file has not been supplied. */
export function resolveAsset(ref: AssetRef | undefined): string | null {
  if (!ref || !ref.ready) return null;
  return publicUrl(ref.path);
}

export const isReady = (ref: AssetRef | undefined): boolean =>
  Boolean(ref?.ready);

/* ==========================================================================
   MANIFEST
   ========================================================================== */

export const assets = {
  /** Realistic 3D character for the hero. GLB / GLTF, supplied later. */
  character: {
    /**
     * SUPPLIED — Microsoft Rocketbox `Business_Male_06`, MIT licensed.
     * See public/models/CHARACTER-LICENSE.md for source and attribution, and
     * for what the FBX → GLB conversion changed.
     *
     * 3.86 MB, 6,950 triangles, 81 joints, Y-up, 1.81 units tall with the
     * origin at the feet — so `characterScale: 1` needs no correction. Carries
     * `Bip01 Head/Neck/LEye/REye` and ARKit `eyeBlinkLeft` / `eyeBlinkRight`,
     * which is the full tier-1 gaze.
     */
    model: asset('model', 'models/character.glb', '3D character (GLB/GLTF)', {
      ready: true,
    }),
  },

  /**
   * Hero identity pair for the Phase 2 cursor reveal.
   * `clean` and `futuristic` MUST be the same pixel dimensions and framing —
   * the reveal only moves a mask, it never transforms either image.
   */
  hero: {
    /**
     * SUPPLIED — 777 x 971 (4:5).
     *
     * Built from the original studio photograph by
     * `scripts/prepare-portrait.py`. A person matte — not a rectangle —
     * replaces the white studio backdrop with `--c-bg-2`; the subject is
     * cropped and scaled uniformly, never generated or reshaped.
     *
     * The hero frame is 4:5 at every breakpoint to match, so `object-fit:
     * cover` trims nothing and the face, hair and shoulders are intact at
     * every width. `focus` is therefore inert today, and is kept so a
     * replacement image of a different ratio still has an anchor.
     *
     * `public/images/hero-clean.png` is the same pixels with real alpha, for
     * when the portrait needs to sit on the page without a panel behind it.
     */
    clean: asset('image', 'images/hero-clean.jpg', 'Hero — clean portrait', {
      ready: true,
      alt: 'Tamil Ramamoorthi',
      focus: '50% 50%',
    }),

    /**
     * The file EXISTS — 777 x 971 (4:5), built by `scripts/make-hero-ai.py`
     * from the same photograph as `clean`, so the two align pixel for pixel
     * (verified by `scripts/check-hero-alignment.py`: zero translation,
     * structure r = 0.98, silhouette IoU = 0.99).
     *
     * `ready` is true as of Phase 2C: the reveal ships, so this layer is now
     * rendered and the preloader should wait for it. It is in
     * `criticalAssets` for exactly that reason — the reveal must not be able
     * to expose a half-decoded image on first hover.
     */
    futuristic: asset(
      'image',
      'images/hero-ai.jpg',
      'Hero — futuristic AI identity',
      {
        ready: true,
        alt: 'Tamil Ramamoorthi rendered as a futuristic AI identity',
      },
    ),
    /** Optional HDR for scene lighting; the scene falls back to lights only. */
    hdr: asset('hdr', 'textures/studio.hdr', 'Hero HDR environment'),
  },

  /**
   * SUPPLIED — the real resume, copied in unmodified (350 KB, 1 page,
   * PDF 1.7). Served as a static file and linked from the contact section.
   */
  resume: asset('document', 'resume/Tamil-Ramamoorthi-Resume.pdf', 'Resume PDF', {
    ready: true,
  }),

  /**
   * CONFERENCE PAPER
   * `paper` is SUPPLIED — the author's own PDF, copied in unmodified
   * (955 KB, PDF 1.5). The "Read paper" control opens it in a new tab.
   *
   * `cover` has not been supplied, so it stays not-ready and the research
   * card renders with no document preview. It is meant to be an export of the
   * paper's own FIRST PAGE — not a designed cover, and never a fabricated
   * journal front matter.
   */
  research: {
    paper: asset(
      'document',
      'research/ai-ml-in-smart-production.pdf',
      'Conference paper PDF',
      { ready: true },
    ),
    cover: asset(
      'image',
      'research/ai-ml-in-smart-production-p1.jpg',
      'Conference paper — first page',
      {
        alt: 'First page of the conference paper "Artificial Intelligence and Machine Learning in Smart Production"',
      },
    ),
  },

  social: {
    ogImage: asset('image', 'images/og.jpg', 'Open Graph preview image'),
  },
} as const;

/* ==========================================================================
   PROJECT SCREENSHOTS
   ========================================================================== */

export interface ProjectShot extends AssetRef {
  /** Carousel caption, e.g. "Dashboard". */
  readonly caption: string;
}

/**
 * Declares one screenshot slot for a project.
 * Convention: `public/images/projects/<projectId>/<slug>.<ext>`
 */
export function projectShot(
  projectId: string,
  file: string,
  caption: string,
  ready = false,
): ProjectShot {
  return {
    kind: 'image',
    path: `images/projects/${projectId}/${file}`,
    label: `${projectId} — ${caption}`,
    alt: `${caption} screenshot`,
    caption,
    ready,
  };
}

/* ==========================================================================
   EXPERIENCE MEDIA  (certificates and role imagery)
   ========================================================================== */

/** An asset that carries a printed caption — certificates, role imagery. */
export interface CaptionedAsset extends AssetRef {
  /** Caption printed under the figure, e.g. "Internship certificate". */
  readonly caption: string;
}

/** Alias kept because the Experience data reads better with this name. */
export type ExperienceAsset = CaptionedAsset;

/**
 * Declares one media slot for an experience entry.
 * Convention: `public/images/experience/<file>`
 *
 * NOTHING here is ready yet — no certificate file is in the repository, so
 * every slot resolves to null and the Experience section omits its media
 * column entirely. A fabricated certificate is worse than no certificate, so
 * these slots render nothing rather than scaffolding. Drop the real scan at
 * the declared path and pass `ready` to switch it on.
 */
export function experienceAsset(
  file: string,
  caption: string,
  alt: string,
  ready = false,
): CaptionedAsset {
  return {
    kind: 'image',
    path: `images/experience/${file}`,
    label: caption,
    alt,
    caption,
    ready,
  };
}

/* ==========================================================================
   ACHIEVEMENT / CERTIFICATE MEDIA
   ========================================================================== */

/**
 * Declares one certificate image slot.
 * Convention: `public/images/achievements/<file>`
 *
 * NOTHING here is ready. No certificate image has been supplied to the
 * repository, so every slot resolves to null, no "view certificate" control
 * renders, and no preview frame appears. Certificates are the one asset class
 * that gets no placeholder scaffolding anywhere in this codebase — a
 * fabricated certificate is a forgery, and a frame that implies one exists is
 * nearly as bad.
 *
 * WHEN SUPPLYING ONE, CROP IT FIRST. Keep the title, organisation, award, date
 * and official design; crop or cover QR codes, serial and registration
 * numbers, dates of birth and candidate identifiers. Never alter the
 * certificate's factual text. See public/images/achievements/README.md.
 */
export function achievementAsset(
  file: string,
  caption: string,
  alt: string,
  ready = false,
): CaptionedAsset {
  return {
    kind: 'image',
    path: `images/achievements/${file}`,
    label: caption,
    alt,
    caption,
    ready,
  };
}

/* ==========================================================================
   LOAD BUDGET
   Only assets listed here are waited on by the preloader. Everything else is
   fetched lazily so the page is never blocked by a heavy file.
   ========================================================================== */

export const criticalAssets: readonly AssetRef[] = [
  assets.hero.clean,
  assets.hero.futuristic,
];

/*
  The character GLB is NOT listed. The hero no longer mounts a figure, so
  fetching 3.86 MB for a model nothing renders would be pure waste. The file
  and its licence stay in public/models/ — only the preload is withdrawn.
*/
export const lazyAssets: readonly AssetRef[] = [assets.hero.hdr];
