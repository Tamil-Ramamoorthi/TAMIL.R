import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap } from "../../animations/gsapSetup";
import { REVEAL_VIEWBOX, initHeroReveal } from "../../animations/heroReveal";
import {
  portraitAt,
  type TransformProgress,
} from "../../animations/heroTransformation";
import { assets, isReady, resolveAsset } from "../../config/assets";
import { features } from "../../config/site";
import { AssetPlaceholder } from "../common/AssetPlaceholder";

/**
 * HERO PORTRAIT
 * =============
 * The identity layer stack for the hero.
 *
 *   Layer 1  real portrait        — a plain <img>, always visible
 *   Layer 2  futuristic AI image  — an SVG <image>, revealed by a mask
 *
 * Both layers share one fixed-ratio frame and are sized identically, because
 * the reveal moves only a mask: neither image is ever scaled, moved or
 * rotated independently. The AI layer is an SVG rather than a second <img>
 * purely so the mask can live in the same coordinate space as the picture.
 *
 * WHY THE GEOMETRY MATCHES
 * ------------------------
 * The clean <img> fills the frame with `object-fit: cover`. The SVG uses the
 * asset's own pixel grid as its viewBox and `preserveAspectRatio` with
 * `slice`, which is the same computation cover performs. With the frame, the
 * clean plate and the AI plate all at 777 x 971, the two layers resolve to
 * the same sub-pixel geometry.
 *
 * Cropping: the frame is 4 / 5 at every breakpoint, which is the portrait
 * asset's own ratio, so `object-fit: cover` scales the image and trims
 * nothing — the face, hair, shoulders and shirt are intact at every width,
 * and only the frame's width changes between breakpoints. The asset's `focus`
 * value still drives `object-position`, so swapping in an image of a
 * different ratio stays a one-line change in src/config/assets.ts.
 *
 * All reveal movement happens in `initHeroReveal`, outside React — this
 * component renders once and never re-renders on pointer movement.
 *
 * PHASE 3B — THE DOMINANT AI LAYER
 * --------------------------------
 * The transformation adds a THIRD layer: the same AI plate at full coverage,
 * above the masked one, faded up from the hero's transformation progress.
 *
 * It is additive on purpose. `initHeroReveal` is untouched, the mask still owns
 * the cursor interaction, and with the feature off this layer does not render at
 * all — so Phase 2C behaves exactly as it did. Once the hero has transformed the
 * full layer covers the masked one, which is what makes the AI identity final.
 */
export interface HeroPortraitProps {
  /**
   * Hero transformation carrier. When present, the dominant AI layer renders and
   * tracks it. Absent means Phase 2C behaviour, unchanged.
   */
  progress?: TransformProgress;
  /** Receives the portrait frame, so the orbit can revolve around it. */
  onFrame?: (element: HTMLElement | null) => void;
}

export function HeroPortrait({ progress, onFrame }: HeroPortraitProps) {
  const clean = assets.hero.clean;
  const futuristic = assets.hero.futuristic;

  const cleanSrc = resolveAsset(clean);
  const aiSrc = resolveAsset(futuristic);

  const frameRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const aiFullRef = useRef<HTMLImageElement>(null);

  /** Hands the frame to both the reveal and, optionally, the orbit. */
  const setFrame = (element: HTMLElement | null) => {
    frameRef.current = element;
    onFrame?.(element);
  };

  const showAiLayer = Boolean(progress) && isReady(futuristic) && Boolean(aiSrc);

  // Only ever true once a real AI image exists AND the reveal ships.
  const showRevealLayer = features.heroReveal && isReady(futuristic) && Boolean(aiSrc);

  useGSAP(
    () => {
      if (!showRevealLayer) return;
      const frame = frameRef.current;
      const path = pathRef.current;
      if (!frame || !path) return;

      return initHeroReveal({ frame, path });
    },
    { dependencies: [showRevealLayer] },
  );

  /* ---------- Dominant AI layer ----------
     One opacity write per frame, off the shared gsap ticker — no React state, so
     the transformation never re-renders this tree. */
  useGSAP(
    () => {
      const layer = aiFullRef.current;
      if (!layer || !progress) return;

      let last = -1;
      const tick = () => {
        const next = portraitAt(progress.value);
        if (Math.abs(next - last) < 0.002) return;
        last = next;
        layer.style.opacity = next.toFixed(3);
      };

      tick();
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    },
    { dependencies: [showAiLayer, progress] },
  );

  if (!cleanSrc) {
    return (
      <div className="hero__portrait">
        <AssetPlaceholder asset={clean} ratio="fill" center />
      </div>
    );
  }

  return (
    <figure className="hero__portrait" ref={setFrame}>
      <img
        className="hero__portrait-img"
        src={cleanSrc}
        alt={clean.alt ?? ""}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        sizes="(min-width: 62rem) 29rem, (min-width: 48rem) 19rem, (min-width: 30rem) 15rem, 13rem"
        style={clean.focus ? { objectPosition: clean.focus } : undefined}
      />

      {showAiLayer ? (
        <img
          className="hero__portrait-ai-full"
          ref={aiFullRef}
          src={aiSrc ?? ""}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          style={{ opacity: 0 }}
        />
      ) : null}

      {showRevealLayer ? (
        <svg
          className="hero__portrait-ai"
          viewBox={`0 0 ${REVEAL_VIEWBOX.w} ${REVEAL_VIEWBOX.h}`}
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            {/*
              Two scales of irregularity. feTurbulence + feDisplacementMap
              warp the spline outline through fractal noise, so the boundary
              wanders instead of following the curve exactly. feGaussianBlur
              then feathers it, so there is no hard edge anywhere. sRGB
              interpolation keeps the falloff perceptually even.
            */}
            <filter
              id="hero-reveal-fx"
              x="-25%"
              y="-25%"
              width="150%"
              height="150%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.009 0.013"
                numOctaves={2}
                seed={7}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={46}
                xChannelSelector="R"
                yChannelSelector="G"
                result="warped"
              />
              <feGaussianBlur in="warped" stdDeviation={26} />
            </filter>

            {/* Blur only — the cheap path for low-end devices. The spline
                itself is already irregular, so this is still not a circle. */}
            <filter
              id="hero-reveal-fx-soft"
              x="-25%"
              y="-25%"
              width="150%"
              height="150%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur in="SourceGraphic" stdDeviation={30} />
            </filter>

            <mask
              id="hero-reveal-mask"
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width={REVEAL_VIEWBOX.w}
              height={REVEAL_VIEWBOX.h}
            >
              <path
                className="hero__reveal-shape"
                ref={pathRef}
                fill="#fff"
                d=""
                style={{ opacity: 0 }}
              />
            </mask>
          </defs>

          <image
            href={aiSrc ?? ""}
            x="0"
            y="0"
            width={REVEAL_VIEWBOX.w}
            height={REVEAL_VIEWBOX.h}
            mask="url(#hero-reveal-mask)"
            preserveAspectRatio="xMidYMid slice"
          />
        </svg>
      ) : null}

      <span className="hero__portrait-grade" aria-hidden="true" />
      <span className="hero__portrait-scrim" aria-hidden="true" />
      <span className="hero__portrait-frame" aria-hidden="true" />
    </figure>
  );
}
