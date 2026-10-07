import { useGSAP } from "@gsap/react";
import { useMemo, useRef } from "react";
import { gsap } from "../../animations/gsapSetup";
import { clearOrbitFocus, setOrbitFocus } from "../../animations/heroSignal";
import { clamp, lerp } from "../../animations/math";
import { orbitLayout } from "../../config/site";
import { orbitSubset, verifyOrbitTechnologies } from "../../data";
import { getPointer } from "../../hooks/pointerStore";
import type { TechIconKey } from "../../data";
import {
  SiCss,
  SiFlask,
  SiGithub,
  SiGooglegemini,
  SiHtml5,
  SiJavascript,
  SiMysql,
  SiOllama,
  SiPython,
  SiScikitlearn,
} from "react-icons/si";

/**
 * Marks, resolved here rather than in the shared Icon registry so they land in
 * this lazily-loaded chunk. Every brand mark ships with react-icons (Simple
 * Icons) — nothing is downloaded, and no logo is redrawn by hand.
 */
const TECH_ICONS: Record<TechIconKey, React.ComponentType> = {
  python: SiPython,
  javascript: SiJavascript,
  html: SiHtml5,
  css: SiCss,
  mysql: SiMysql,
  sklearn: SiScikitlearn,
  gemini: SiGooglegemini,
  ollama: SiOllama,
  flask: SiFlask,
  github: SiGithub,
};

/**
 * TECHNOLOGY ORBIT
 * ================
 * The tools behind the AI identity, running on THREE separate orbital planes
 * around the portrait.
 *
 * AUTONOMOUS
 * ----------
 * The orbit mounts with the hero, is fully visible from its first frame and
 * turns on its own. Nothing gates it — no click, no hover, no transformation
 * phase. The pointer is an enhancement only: it can brighten, nudge and lean
 * the nodes, but it never shows, hides, starts, stops or changes the speed of
 * anything.
 *
 * THREE LAYERS, NOT ONE RING
 * --------------------------
 * `orbitLayout.rings` declares an inner, a middle and an outer orbit, each with
 * its own radii, period, direction and plane angle. Nothing is a multiple of
 * anything else, so the layers never re-align and the system never resolves
 * into a single spinning dial. Which technology rides which layer, and where
 * it starts, is declared per entry in `orbitTechnologies`; ranks are chosen
 * so a reduced device budget thins every layer instead of deleting one.
 *
 * THE ICONS STAY UPRIGHT
 * ----------------------
 * The PATH rotates; the mark never does. Every write in `place()` is
 * `translate3d(...) scale(...)` — there is no `rotate` anywhere on an item, so
 * a Python or Flask logo cannot end up on its side and no counter-rotation is
 * needed to undo one. The only rotation in the system is a ±3° CSS sway on the
 * glyph inside each disc (orbit.css), which reads as the node being alive
 * rather than as the logo turning. The per-layer plane angle is applied by rotating the
 * offset VECTOR in the maths below, which moves where the icon is without
 * touching how it sits.
 *
 * PORTRAIT PROTECTION
 * -------------------
 * Two mechanisms, and between them an icon can never land on the face:
 *
 *   1. The near half of every orbit — the half that paints in FRONT of the
 *      portrait — is pushed below the chin by `orbitLayout.centreY`. The
 *      ellipse centre sits at +0.14w and the near arc only ever runs downward
 *      from there, across the collar and the shirt.
 *   2. The far half paints BEHIND the portrait (`z-index: -1` against the
 *      frame's own layer), and the frame is opaque. An icon rounding the back
 *      of the orbit is occluded by the portrait exactly as a satellite is
 *      occluded by a planet — it is never drawn over the hair or the face.
 *
 * Nothing is faded to nothing to achieve this: the depth floors stay high and
 * the icons are hidden only by real geometry.
 *
 * DOM, NOT WEBGL
 * --------------
 * These are icons and labels, which the DOM renders crisply at any DPI and
 * styles with the same tokens as the rest of the page. Putting them in the
 * canvas would mean texture atlases and blurry text for no gain.
 *
 * ONE LOOP FOR EVERYTHING
 * -----------------------
 * A single `gsap.ticker` callback integrates every angle and writes every
 * transform — one loop for all three layers, their guide rings and the
 * cursor lean. No per-icon loop, no React state in the frame path, no layout
 * reads: the portrait's box is cached through a ResizeObserver, and the whole
 * frame is N transform writes. The loop skips its work while the portrait is
 * scrolled out of view, and resumes where it left off.
 *
 * WHY `pointer-events: none` EVERYWHERE
 * -------------------------------------
 * Focus is proximity-based, measured from the shared pointer store, rather than
 * CSS `:hover`. The orbit can never intercept a click meant for the CTA
 * underneath it, the same code path serves mouse and touch, and an icon can
 * respond before the cursor is literally on top of it — which is what makes it
 * feel like attention rather than a button.
 *
 * ACCESSIBILITY
 * -------------
 * `aria-hidden`, and nothing here is focusable. Every technology shown is
 * already listed in the Tech Stack section as real content.
 */

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

const RINGS = orbitLayout.rings;

interface OrbitItem {
  readonly id: string;
  readonly label: string;
  readonly icon: TechIconKey;
  /** Index into `orbitLayout.rings`. */
  readonly ring: number;
  /** Starting angle, radians. */
  readonly baseAngle: number;
  /** Tiny per-icon radius variation, so a layer is not a perfect ellipse. */
  readonly wobble: number;
  /** Phase offset for the individual float, so they do not bob in unison. */
  readonly floatPhase: number;
  /** Float rate in turns per second, from the entry's `animationSpeed`. */
  readonly floatRate: number;
  /** Phase offset for the idle brightness shimmer. */
  readonly shimmerPhase: number;
  /** The glyph sway: CSS-driven, so it only needs a period and a phase. */
  readonly swayDuration: number;
  readonly swayDelay: number;
}

/** Base float rate, turns per second, before a node's `animationSpeed`. */
const FLOAT_RATE = 0.28;
/** Base glyph-sway period, seconds, before a node's `animationSpeed`. */
const SWAY_PERIOD = 9;

/**
 * Resolves the data into orbit items. Layer and starting position come
 * straight from each entry; only the small organic offsets — radius wobble and
 * the float, shimmer and sway phases — are generated, from a fixed seed, so
 * the composition is identical on every load.
 */
function buildItems(count: number): OrbitItem[] {
  let seed = 20260408;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  return orbitSubset(count).map((tech) => {
    const ring = RINGS.findIndex((layer) => layer.id === tech.orbit);
    return {
      id: tech.id,
      label: tech.label,
      icon: tech.icon,
      ring: Math.max(0, ring),
      baseAngle: tech.position * TAU,
      wobble: 0.97 + random() * 0.06,
      floatPhase: random() * TAU,
      floatRate: FLOAT_RATE * tech.animationSpeed,
      shimmerPhase: random() * TAU,
      swayDuration: SWAY_PERIOD / tech.animationSpeed,
      // Negative, so every glyph starts mid-cycle instead of in unison.
      swayDelay: -random() * 12,
    };
  });
}

export interface TechnologyOrbitProps {
  /** Icons to show; comes from the device quality budget. */
  count: number;
  reducedMotion: boolean;
  /** The portrait frame the orbit revolves around. */
  anchorRef: React.RefObject<HTMLElement | null>;
  /** Multiplier on every radius — below 1 on tablets. Defaults to 1. */
  radiusScale?: number;
}

export function TechnologyOrbit({
  count,
  reducedMotion,
  anchorRef,
  radiusScale = 1,
}: TechnologyOrbitProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const items = useMemo(() => buildItems(count), [count]);

  if (import.meta.env.DEV) verifyOrbitTechnologies();

  useGSAP(
    () => {
      const root = rootRef.current;
      const anchor = anchorRef.current;
      if (!root || !anchor) return;

      const nodes = Array.from(
        root.querySelectorAll<HTMLElement>("[data-orbit-item]"),
      );
      if (nodes.length === 0) return;

      const rings = Array.from(
        root.querySelectorAll<HTMLElement>("[data-orbit-ring]"),
      );

      /* ---------- Cached geometry ----------
         The ticker must never read layout, so the portrait's box, the host
         box, the icon size and the fit scale are all measured here and
         refreshed only when something actually changes. */
      let box = anchor.getBoundingClientRect();
      // Offset from the orbit container centre to the portrait centre.
      let centreX = 0;
      let centreY = 0;
      // The portrait's centre in viewport space, for the proximity test.
      let portraitX = 0;
      let portraitY = 0;
      // Shrinks every radius until the widest orbit clears the viewport.
      let fit = 1;

      const measure = () => {
        box = anchor.getBoundingClientRect();
        const host = root.getBoundingClientRect();
        portraitX = box.left + box.width / 2;
        portraitY = box.top + box.height / 2;
        centreX = portraitX - (host.left + host.width / 2);
        centreY = portraitY - (host.top + host.height / 2);

        /* ---------- Fit ----------
           Read the rendered icon rather than assuming a size, so the narrow
           breakpoints in orbit.css are respected without duplicating them
           here. Then shrink the radii until the widest orbit's extremes are
           inside the viewport on both sides and below. This is what keeps a
           phone from pushing an icon off the edge — no media query, and no
           viewport-specific tuning. */
        const iconRadius = (nodes[0]?.offsetWidth ?? 40) / 2;
        const outer = RINGS[RINGS.length - 1]!;
        const offsetX = box.width * orbitLayout.centreX;
        const offsetY = box.width * orbitLayout.centreY;
        const spanX = box.width * outer.radiusX;
        const spanY = box.width * outer.radiusY;

        const roomRight =
          box.width / 2 +
          (window.innerWidth - box.right) -
          iconRadius -
          offsetX;
        const roomLeft =
          box.width / 2 + box.left - iconRadius + offsetX;
        const roomDown =
          box.height / 2 +
          (window.innerHeight - box.bottom) -
          iconRadius -
          offsetY;

        fit =
          clamp(
            Math.min(roomRight / spanX, roomLeft / spanX, roomDown / spanY, 1),
            orbitLayout.minFit,
            1,
          ) * radiusScale;

        // Guide rings are sized here, not in the ticker: their dimensions only
        // change when the portrait does, and writing width/height every frame
        // would invalidate layout 60 times a second.
        rings.forEach((ring, index) => {
          const layer = RINGS[index];
          if (!layer) return;
          ring.style.width = `${box.width * layer.radiusX * fit * 2}px`;
          ring.style.height = `${box.width * layer.radiusY * fit * 2}px`;
        });
      };

      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(anchor);
      observer.observe(root);
      const onScrollOrResize = measure;
      window.addEventListener("scroll", onScrollOrResize, { passive: true });
      window.addEventListener("resize", onScrollOrResize, { passive: true });

      // Only animate while the portrait is on screen. Purely a cost saving:
      // the angles simply resume from where they stopped.
      let onScreen = true;
      const visibility = new IntersectionObserver((entries) => {
        onScreen = entries[entries.length - 1]?.isIntersecting ?? true;
      });
      visibility.observe(anchor);

      // Accumulated angles — integrated, not derived from absolute time, so
      // the motion never jumps when the loop resumes.
      const angles = new Float32Array(items.length);
      for (let i = 0; i < items.length; i += 1) angles[i] = items[i]!.baseAngle;

      const scales = new Float32Array(items.length).fill(1);
      const focuses = new Float32Array(items.length);
      // Quantised brightness, written only when it actually moves a step.
      const lumens = new Float32Array(items.length).fill(-1);
      // Which side of the orbital plane each icon is on, so the z-index flip
      // is written once per crossing rather than once per frame.
      const sides = new Int8Array(items.length).fill(0);

      /* ---------- Cursor response ----------
         `tilt` leans the whole system toward the pointer. Damped hard, so the
         rig drifts rather than tracks: it has to stay a stable object. */
      const tilt = { x: 0, y: 0 };

      /** Writes one icon's transform. Shared by the static and animated paths. */
      const place = (index: number, elapsed: number) => {
        const item = items[index]!;
        const node = nodes[index];
        const layer = RINGS[item.ring];
        if (!node || !layer) return 0;

        const angle = angles[index]!;
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        /* Depth comes from the orbital angle, not from a fixed per-icon value:
           1 at the near point of the ellipse, 0 at the far point. Everything
           below — scale, opacity, brightness, paint order — reads from it, so
           one icon genuinely swells as it comes round the front and settles as
           it goes behind. */
        const near = (sin + 1) / 2;

        const radiusMul = item.wobble * fit;
        const rx = box.width * layer.radiusX * radiusMul;
        const ry = box.width * layer.radiusY * radiusMul;

        const float = reducedMotion
          ? 0
          : Math.sin(elapsed * item.floatRate * TAU + item.floatPhase) *
            orbitLayout.floatAmplitude;

        /* The layer's plane angle is applied to the offset VECTOR. The icon
           itself is never rotated — see the upright guarantee above. */
        const ox = cos * rx;
        const oy = sin * ry + float;
        const planeCos = Math.cos(layer.tiltDeg * DEG);
        const planeSin = Math.sin(layer.tiltDeg * DEG);
        const px = ox * planeCos - oy * planeSin + box.width * orbitLayout.centreX;
        const py = ox * planeSin + oy * planeCos + box.width * orbitLayout.centreY;

        // The lean. A parallax shift of the whole layer, scaled by how far out
        // that layer sits, which is what separates the three planes in depth.
        const leanX = tilt.x * rx * orbitLayout.tilt * layer.lean;
        const leanY = tilt.y * ry * orbitLayout.tilt * layer.lean;

        // The container and the portrait are not guaranteed to share a centre
        // (on desktop the stage column is wider than the frame), so the offset
        // between the two is folded into the transform. Both are cached, so
        // this still reads no layout.
        const localX = px + leanX;
        const localY = py + leanY;
        const x = localX + centreX;
        const y = localY + centreY;

        /* Paint order. The far half goes behind the portrait, which is opaque
           — that is the occlusion that protects the face, and it is also what
           makes the system read as orbiting a solid object rather than
           sliding across a flat one. Written only on a crossing. */
        const side = sin >= 0 ? 1 : -1;
        if (sides[index] !== side) {
          sides[index] = side;
          node.dataset.behind = side < 0 ? "true" : "false";
        }

        // Proximity focus, in viewport space. The lean is included so the test
        // moves with the icons rather than lagging behind them. An occluded
        // icon cannot be attended to — it is not on screen.
        const occluded =
          side < 0 &&
          Math.abs(localX) < box.width / 2 &&
          Math.abs(localY) < box.height / 2;
        const pointer = getPointer();
        const towardX = pointer.x - (portraitX + localX);
        const towardY = pointer.y - (portraitY + localY);
        const distance = Math.hypot(towardX, towardY);
        const focus =
          reducedMotion || !pointer.moved || occluded
            ? 0
            : 1 - clamp(distance / orbitLayout.focusRadius, 0, 1);

        // A few pixels of lean toward the pointer, along the line to it. Zero
        // whenever focus is, so an untouched orbit keeps its exact path.
        const pull =
          distance > 1 ? (focus * orbitLayout.focusPull) / distance : 0;
        const pullX = towardX * pull;
        const pullY = towardY * pull;

        const depthScale =
          lerp(orbitLayout.scaleFar, orbitLayout.scaleNear, near) * layer.scale;
        // Eased, so an icon swells rather than snapping when approached.
        const target = depthScale * (1 + focus * focus * 0.22);
        scales[index] = reducedMotion
          ? target
          : lerp(scales[index]!, target, 0.16);

        const opacity =
          lerp(orbitLayout.opacityFar, orbitLayout.opacityNear, near) +
          focus * 0.22;

        node.style.transform = `translate3d(${(x + pullX).toFixed(1)}px, ${(
          y + pullY
        ).toFixed(1)}px, 0) scale(${scales[index]!.toFixed(3)})`;
        node.style.opacity = Math.min(1, opacity).toFixed(3);

        /* Brightness. A custom property rather than a per-frame filter write:
           quantised to sixteenths, so it changes a handful of times per lap
           instead of sixty times a second. The idle shimmer rides on it — the
           reason an untouched hero still has something happening in it. */
        const shimmer = reducedMotion
          ? 0
          : (Math.sin(
              elapsed * orbitLayout.shimmerRate * TAU + item.shimmerPhase,
            ) *
              0.5 +
              0.5) *
            orbitLayout.shimmerDepth;
        const lumen =
          Math.round(clamp(near + shimmer + focus * 0.4, 0, 1) * 16) / 16;
        if (lumens[index] !== lumen) {
          lumens[index] = lumen;
          node.style.setProperty("--orbit-near", lumen.toFixed(3));
        }

        // The attribute is the only thing CSS reads, so it is written on a
        // crossing of the threshold rather than on every frame.
        const wasFocused = focuses[index]! > 0.55;
        const isFocused = focus > 0.55;
        if (wasFocused !== isFocused) {
          node.dataset.focused = isFocused ? "true" : "false";
        }
        focuses[index] = focus;

        return focus;
      };

      const placeRings = () => {
        const ringRotate = tilt.x * orbitLayout.tiltRotate;
        rings.forEach((ring, index) => {
          const layer = RINGS[index];
          if (!layer) return;
          const x =
            centreX +
            box.width * orbitLayout.centreX +
            tilt.x * orbitLayout.tilt * 46 * layer.lean;
          const y =
            centreY +
            box.width * orbitLayout.centreY +
            tilt.y * orbitLayout.tilt * 46 * layer.lean;
          ring.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(
            1,
          )}px, 0) translate(-50%, -50%) rotate(${(
            layer.tiltDeg + ringRotate
          ).toFixed(2)}deg)`;
        });
      };

      const teardown = () => {
        observer.disconnect();
        visibility.disconnect();
        window.removeEventListener("scroll", onScrollOrResize);
        window.removeEventListener("resize", onScrollOrResize);
      };

      /* ---------- Reduced motion ----------
         No ticker, no float, no shimmer. Every icon is parked on the
         near arc of its own layer, which is the half that is never occluded by
         the portrait, so all of them stay readable — and the glow is dropped
         to the resting level by the data attribute never being set. */
      if (reducedMotion) {
        for (let i = 0; i < items.length; i += 1) {
          const item = items[i]!;
          const onRing = items.filter((other) => other.ring === item.ring);
          const slot = onRing.indexOf(item);
          // 0.12π .. 0.88π — the visible near arc, ends trimmed so nothing
          // parks exactly on the plane crossing.
          const spread =
            onRing.length === 1
              ? 0.5
              : 0.12 + (slot / (onRing.length - 1)) * 0.76;
          angles[i] = spread * Math.PI;
          place(i, 0);
        }
        placeRings();
        return teardown;
      }

      /* ---------- Autonomous loop ----------
         Installed the moment the orbit mounts. Every layer turns at its own
         fixed rate (`orbitLayout.rings[].period`) — the pointer has no say in
         the speed. */
      let elapsed = 0;

      const tick = (_time: number, deltaMs: number) => {
        if (!onScreen) return;
        const dt = Math.min(deltaMs, 50) / 1000;
        elapsed += dt;

        /* Lean toward the pointer, eased. `nx/ny` are viewport-normalised, so
           the orbit leans the same way wherever it sits on screen. */
        const pointer = getPointer();
        const live = pointer.moved && pointer.inside;
        tilt.x = lerp(tilt.x, live ? pointer.nx : 0, orbitLayout.tiltDamp);
        tilt.y = lerp(tilt.y, live ? -pointer.ny : 0, orbitLayout.tiltDamp);

        let peakFocus = 0;

        for (let i = 0; i < items.length; i += 1) {
          const layer = RINGS[items[i]!.ring]!;
          // One shared rate per layer, so nodes on a layer keep their spacing.
          angles[i] = angles[i]! + dt * (TAU / layer.period) * layer.direction;

          const focus = place(i, elapsed);
          if (focus > peakFocus) peakFocus = focus;
        }

        placeRings();

        // Hand the attention level to the AI tracker, so the core brightens
        // with the icons it is notionally at the centre of.
        setOrbitFocus(peakFocus);
      };

      gsap.ticker.add(tick);

      return () => {
        gsap.ticker.remove(tick);
        clearOrbitFocus();
        teardown();
      };
    },
    { dependencies: [reducedMotion, items, anchorRef, radiusScale] },
  );

  return (
    <div className="orbit" ref={rootRef} aria-hidden="true">
      {/* Guide rings, one per orbital layer. Sized from the portrait on
          measure, transformed per frame, visible from the first frame (their
          alpha is in orbit.css). Purely decorative: they carry no
          technology meaning, and they live behind the portrait so each one
          reads as a path passing around a solid object. */}
      {RINGS.map((layer) => (
        <span
          className="orbit__ring"
          data-orbit-ring
          data-orbit-layer={layer.id}
          key={layer.id}
        />
      ))}

      {items.map((item) => (
        <span
          className="orbit__item"
          data-orbit-item
          data-orbit-layer={RINGS[item.ring]!.id}
          key={item.id}
          style={
            {
              "--orbit-sway-duration": `${item.swayDuration.toFixed(2)}s`,
              "--orbit-sway-delay": `${item.swayDelay.toFixed(2)}s`,
            } as React.CSSProperties
          }
        >
          <span className="orbit__icon">
            {(() => {
              const Mark = TECH_ICONS[item.icon];
              return <Mark />;
            })()}
          </span>
          <span className="orbit__label">{item.label}</span>
        </span>
      ))}
    </div>
  );
}

export default TechnologyOrbit;
