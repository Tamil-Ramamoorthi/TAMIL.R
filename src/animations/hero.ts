/**
 * HERO ANIMATIONS
 * One orchestrated entrance timeline — not a pile of per-element tweens.
 * Phase 2 hooks the cursor reveal and the character rig onto the same clock.
 */

import { EASE, ScrollTrigger, T, gsap, motionEnabled } from "./gsapSetup";

export interface HeroElements {
  root: HTMLElement;
  /** Elements marked `data-hero` inside the hero, in document order. */
  scene?: HTMLElement | null;
  cue?: HTMLElement | null;
}

/**
 * Entrance. Returns the timeline so the caller can chain it after the
 * preloader exit, keeping the whole intro on a single clock.
 */
export function heroIntro(elements: HeroElements): gsap.core.Timeline {
  const { root, scene, cue } = elements;
  const timeline = gsap.timeline({ defaults: { ease: EASE.out } });

  const titleLines = root.querySelectorAll<HTMLElement>("[data-hero-line]");
  const steps = root.querySelectorAll<HTMLElement>("[data-hero-step]");

  if (!motionEnabled()) {
    // Clear any hidden initial state so nothing is left invisible.
    gsap.set([titleLines, steps], { clearProps: "all", opacity: 1, y: 0 });
    if (scene) gsap.set(scene, { opacity: 1 });
    return timeline;
  }

  if (scene) {
    timeline.fromTo(
      scene,
      { opacity: 0 },
      { opacity: 1, duration: 1.6, ease: EASE.inOut },
      0,
    );
  }

  timeline.to(
    titleLines,
    {
      // `y`, not `yPercent`. The start state is a CSS percentage
      // (`translate3d(0, 110%, 0)` on html.anim-ready .hero__title-line), and
      // GSAP only ever sees the resolved matrix — pixels, with no record that
      // it came from a percentage. It therefore parses that as y = 88.1px,
      // yPercent = 0, so tweening yPercent to 0 is a no-op and the line stays
      // clipped out of its overflow:hidden wrapper forever. Animating `y` is
      // what the [data-hero-step] tween below already does, for the same
      // reason: its start state is a CSS length, and it works.
      y: 0,
      duration: T.reveal,
      ease: EASE.mask,
      stagger: T.staggerSlow,
    },
    0.05,
  );

  timeline.to(
    steps,
    {
      opacity: 1,
      y: 0,
      duration: T.base,
      stagger: T.stagger,
    },
    0.45,
  );

  if (cue) {
    timeline.fromTo(cue, { opacity: 0 }, { opacity: 1, duration: T.base }, 1);
  }

  return timeline;
}

/** Looping scroll cue. Returns a cleanup function. */
export function heroScrollCue(thumb: HTMLElement | null): () => void {
  if (!thumb || !motionEnabled()) return () => {};

  const tween = gsap.fromTo(
    thumb,
    { yPercent: -100 },
    {
      yPercent: 250,
      duration: 1.8,
      ease: "power2.inOut",
      repeat: -1,
      repeatDelay: 0.3,
    },
  );

  return () => tween.kill();
}

/**
 * Parallax as the hero scrolls away: content drifts up and fades, the scene
 * lags behind it. Returns a cleanup function.
 */
export function heroParallax(
  root: HTMLElement,
  content: HTMLElement | null,
  scene: HTMLElement | null,
): () => void {
  if (!motionEnabled()) return () => {};

  const trigger = ScrollTrigger.create({
    trigger: root,
    start: "top top",
    end: "bottom top",
    scrub: true,
    animation: gsap
      .timeline()
      .to(content, { yPercent: -12, opacity: 0.25, ease: "none" }, 0)
      .to(scene, { yPercent: 8, ease: "none" }, 0),
  });

  return () => trigger.kill();
}
