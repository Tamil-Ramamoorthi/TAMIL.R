/**
 * PRELOADER ANIMATION
 * The counter is driven by GSAP reading the live load target each frame, so
 * React is not re-rendered 60 times during boot.
 */

import { EASE, gsap, motionEnabled } from "./gsapSetup";
import { pad2 } from "./math";

export interface PreloaderElements {
  root: HTMLElement;
  counter: HTMLElement;
  bar: HTMLElement;
  curtain: HTMLElement;
  /** Everything that fades out with the intro. */
  content: HTMLElement;
}

export interface PreloaderOptions {
  /** Live object whose `.value` moves 0 → 1 as critical work completes. */
  target: { value: number };
  /** Called once the exit animation has finished and the DOM can unmount. */
  onComplete: () => void;
}

/**
 * Drives the 00 → 100 counter. Returns a stop function.
 * The displayed number only ever moves forward, and eases towards the real
 * load target rather than snapping to it.
 */
export function animateCounter(
  elements: Pick<PreloaderElements, "counter" | "bar">,
  target: { value: number },
): () => void {
  const display = { value: 0 };
  let raf = 0;
  let last = performance.now();

  const render = () => {
    elements.counter.textContent = pad2(display.value * 100);
    gsap.set(elements.bar, { scaleX: display.value });
  };

  if (!motionEnabled()) {
    display.value = 1;
    render();
    return () => {};
  }

  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // Ease towards the target; never regress.
    const next = display.value + (target.value - display.value) * (1 - Math.exp(-6 * dt));
    display.value = Math.max(display.value, Math.min(1, next));
    render();
    raf = requestAnimationFrame(tick);
  };

  render();
  raf = requestAnimationFrame(tick);

  return () => cancelAnimationFrame(raf);
}

/** Intro beat: the wordmark and tagline arrive while loading happens. */
export function preloaderIntro(elements: PreloaderElements): gsap.core.Timeline {
  const timeline = gsap.timeline();

  if (!motionEnabled()) return timeline;

  timeline
    .from(elements.content.querySelectorAll("[data-pre-line]"), {
      yPercent: 110,
      duration: 1,
      ease: EASE.mask,
      stagger: 0.08,
    })
    .from(
      elements.counter,
      { opacity: 0, duration: 0.6, ease: EASE.out },
      "-=0.6",
    );

  return timeline;
}

/**
 * Exit: counter settles, the intro lifts away, then the curtain wipes up to
 * reveal the hero. `onComplete` unmounts the preloader.
 */
export function preloaderExit(
  elements: PreloaderElements,
  onComplete: () => void,
): gsap.core.Timeline {
  const timeline = gsap.timeline({ onComplete });

  if (!motionEnabled()) {
    gsap.set(elements.root, { autoAlpha: 0 });
    timeline.to({}, { duration: 0.01 });
    return timeline;
  }

  timeline
    .to(elements.content, {
      yPercent: -14,
      opacity: 0,
      duration: 0.7,
      ease: EASE.inOut,
    })
    .to(
      elements.bar,
      { opacity: 0, duration: 0.3, ease: EASE.out },
      "-=0.45",
    )
    .to(
      elements.curtain,
      { scaleY: 0, transformOrigin: "top center", duration: 1, ease: EASE.mask },
      "-=0.3",
    )
    .set(elements.root, { autoAlpha: 0 });

  return timeline;
}
