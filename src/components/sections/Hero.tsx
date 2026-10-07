import { useGSAP } from "@gsap/react";
import { Suspense, lazy, useCallback, useRef, useState } from "react";
import { heroIntro, heroParallax, heroScrollCue } from "../../animations/hero";
import { assets } from "../../config/assets";
import { features, orbitLayout } from "../../config/site";
import { education, personal } from "../../data";
import { useDeviceCapabilities } from "../../hooks/useDeviceCapabilities";
import { useHeroExperience } from "../../hooks/useHeroExperience";
import { ActionLink } from "../common/ActionLink";
import { GhostWord } from "../common/GhostWord";
import { SceneFallback } from "../three/SceneFallback";
import { HeroPortrait } from "./HeroPortrait";

/**
 * HERO
 * ====
 * The signature section. Layers, back to front:
 *
 *   1. GhostWord      oversized low-contrast background type
 *   2. scene          CSS fallback, with the WebGL canvas layered over it
 *   3. hero__stage    RESERVED for the Phase 2 cursor reveal
 *   4. hero__content  identity typography and CTAs
 *
 * The WebGL canvas is code-split and mounted only after the preloader hands
 * over, so boot is never gated on three.js.
 *
 * The portrait reveal and the 3D scene are independent systems that happen to
 * share a pointer source: the reveal moves an SVG mask in the DOM, the scene
 * drives bones on the GPU, and neither reads the other's state. A failure in
 * one cannot affect the other.
 *
 * PHASE 3 — the 3D character slot is wired but empty: no model has been
 * supplied yet. See public/models/README.md.
 *
 * PHASE 3B — the human → AI transformation and the technology orbit. Built,
 * typechecked and dormant behind `features.heroTransformation`, which is off
 * because the sequence is meant to OPEN on the 3D character. Without a model it
 * would transform a portrait into the same portrait. It switches on with
 * `character3D`.
 */

const SceneCanvas = lazy(() => import("../three/SceneCanvas"));
/** Code-split: the orbit and its technology marks load only once it is needed. */
const TechnologyOrbit = lazy(() => import("./TechnologyOrbit"));

export interface HeroProps {
  /** True once the preloader has finished. */
  booted: boolean;
}

export function Hero({ booted }: HeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const cueThumbRef = useRef<HTMLSpanElement>(null);

  const { canRender3D, budget, reducedMotion, isTouch, isTablet } =
    useDeviceCapabilities();
  const degree = education[0];

  /* The role reads "AI / ML Engineer | Machine Learning & GenAI Intern". Split
     on the pipe so the separator can carry the accent instead of being another
     grey glyph; the parts themselves are untouched data. */
  const roleParts = personal.title.split("|").map((part) => part.trim());

  /* ---------- Phase 3B ----------
     `phase` changes three times in a session; `progress` is a mutable carrier
     read inside frame loops and never triggers a render. */
  const hero = useHeroExperience();

  // The orbit revolves around the portrait frame, so it needs the real element.
  const [portraitFrame, setPortraitFrame] = useState<HTMLElement | null>(null);
  const onPortraitFrame = useCallback(
    (element: HTMLElement | null) => setPortraitFrame(element),
    [],
  );
  const portraitFrameRef = useRef<HTMLElement | null>(null);
  portraitFrameRef.current = portraitFrame;

  /* ---------- Activation ----------
     Movement or a press inside the identity area, never a timer and never on
     load. `activate()` is guarded, so firing from both handlers is harmless —
     which matters because one touch produces a pointerdown AND a pointermove.

     Deliberately not `onPointerEnter`: a visitor whose cursor already happens to
     be over the hero when it boots would never get an enter event, and would be
     stuck looking at a hero that does nothing. */
  const onIdentityInteract = hero.enabled ? hero.activate : undefined;

  // The identity stage appears as soon as a real image exists.
  const showStage =
    features.heroReveal ||
    assets.hero.clean.ready ||
    assets.hero.futuristic.ready;

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || !booted) return;

      heroIntro({ root, scene: sceneRef.current, cue: cueRef.current });
      const stopCue = heroScrollCue(cueThumbRef.current);
      const stopParallax = heroParallax(
        root,
        contentRef.current,
        sceneRef.current,
      );

      return () => {
        stopCue();
        stopParallax();
      };
    },
    { dependencies: [booted] },
  );

  return (
    <section className="hero section section--hero" id="hero" ref={rootRef}>
      <GhostWord word="Intelligence" className="hero__ghost" variant="fill" />

      <div className="hero__scene scene" ref={sceneRef}>
        <SceneFallback reason={canRender3D ? null : "no-webgl"} />

        {canRender3D && booted ? (
          <Suspense fallback={null}>
            <SceneCanvas
              budget={budget}
              reducedMotion={reducedMotion}
              /* The tracker stays for the whole session, unlike the figure it
                 replaced: it spikes during the transformation and settles back
                 to idle, so there is nothing to unmount afterwards. It is light
                 enough to keep on every tier that has WebGL at all, which is
                 the same condition that mounted this canvas. */
              showTracker
              progress={hero.enabled ? hero.progress : undefined}
            />
          </Suspense>
        ) : null}

        <div className="scene__fade u-decor" aria-hidden="true" />
      </div>

      {/* Blue atmospheric lighting. Pure CSS gradients over the scene and under
          the content, so it separates the typography from the background
          without a blur filter or an extra texture to download. */}
      <div className="hero__atmosphere u-decor" aria-hidden="true" />

      {/* Identity stage. Holds the real portrait now; the Phase 2 reveal adds
          the AI layer into the same frame, where only the mask moves. */}
      {showStage ? (
        <div className="hero__stage">
          <div
            className="hero__identity"
            onPointerMove={onIdentityInteract}
            onPointerDown={onIdentityInteract}
          >
            <HeroPortrait
              progress={hero.enabled ? hero.progress : undefined}
              onFrame={onPortraitFrame}
            />

            {/* Autonomous: mounts as soon as the portrait frame exists —
                visible and turning from the first frame, independent of the
                human → AI transformation and of any pointer interaction. */}
            {portraitFrame ? (
              <Suspense fallback={null}>
                <TechnologyOrbit
                  count={
                    isTouch ? Math.min(5, budget.orbitCount) : budget.orbitCount
                  }
                  reducedMotion={reducedMotion}
                  anchorRef={portraitFrameRef}
                  radiusScale={isTablet ? orbitLayout.tabletRadius : 1}
                />
              </Suspense>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="hero__content" ref={contentRef}>
        <div className="hero__eyebrow" data-hero-step>
          <span className="hero__eyebrow-line" aria-hidden="true" />
          <span className="t-label">{personal.location}</span>
        </div>

        <h1 className="hero__title">
          <span className="u-clip">
            <span className="hero__title-line" data-hero-line>
              Tamil
            </span>
          </span>
          <span className="u-clip">
            <span className="hero__title-line" data-hero-line>
              Ramamoorthi
            </span>
          </span>
        </h1>

        <div className="hero__secondary">
          <span className="hero__panel" aria-hidden="true" />

          <p className="hero__role" data-hero-step>
            {roleParts.map((part, index) => (
              <span key={part}>
                {index > 0 ? (
                  <span className="hero__role-sep" aria-hidden="true">
                    |
                  </span>
                ) : null}
                {part}
              </span>
            ))}
          </p>

          <div className="hero__keywords" data-hero-step>
            {personal.keywords.map((keyword) => (
              <span className="hero__keyword" key={keyword}>
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <div className="hero__actions" data-hero-step>
          <ActionLink
            href="#projects"
            label="View my work"
            icon="arrow-right"
            variant="primary"
            cursor="hover"
          />
          <ActionLink
            href="#contact"
            label="Let’s connect"
            icon="arrow-up-right"
            cursor="hover"
          />
        </div>

        <div className="hero__meta" data-hero-step>
          <div className="hero__meta-group">
            <span className="t-label">Education</span>
            <span className="hero__meta-value">
              {degree ? `${degree.degree} — ${degree.field}` : ""}
            </span>
          </div>
          <div className="hero__meta-group">
            <span className="t-label">CGPA</span>
            <span className="hero__meta-value">
              {degree?.score ? degree.score.value : ""}
            </span>
          </div>
          <div className="hero__meta-group">
            <span className="t-label">Languages</span>
            <span className="hero__meta-value">
              {personal.languages.map((language) => language.name).join(", ")}
            </span>
          </div>
        </div>
      </div>

      <div className="hero__cue" ref={cueRef} aria-hidden="true">
        <span className="t-label">Scroll</span>
        <span className="hero__cue-track">
          <span className="hero__cue-thumb" ref={cueThumbRef} />
        </span>
      </div>
    </section>
  );
}
