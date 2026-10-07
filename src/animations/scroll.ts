/**
 * SCROLL ANIMATIONS
 * ScrollTrigger is registered once in gsapSetup. Reveals are batched so a page
 * with dozens of elements still creates only a handful of triggers.
 */

import { EASE, ScrollTrigger, T, gsap, motionEnabled } from "./gsapSetup";

/**
 * Reveals every `.u-reveal` / `.u-reveal-fade` / `.u-mask-lines` inside
 * `scope`. Elements are hidden by CSS only while <html> has `anim-ready`, so
 * this is additive: if it never runs, everything is simply visible.
 *
 * Returns a cleanup function.
 */
export function initScrollReveals(scope: HTMLElement | Document): () => void {
  if (!motionEnabled()) return () => {};

  const triggers: ScrollTrigger[] = [];

  const batch = (
    selector: string,
    vars: gsap.TweenVars,
    start = "top 85%",
  ) => {
    const elements = Array.from(
      scope.querySelectorAll<HTMLElement>(selector),
    ).filter((element) => !element.dataset.revealDone);

    if (elements.length === 0) return;

    const created = ScrollTrigger.batch(elements, {
      start,
      once: true,
      batchMax: 6,
      onEnter: (batched) => {
        gsap.to(batched, {
          ...vars,
          stagger: T.stagger,
          onComplete: () => {
            for (const element of batched) {
              const node = element as HTMLElement;
              node.dataset.revealDone = "true";
              node.style.willChange = "auto";
            }
          },
        });
      },
    });

    triggers.push(...created);
  };

  batch(".u-reveal", {
    opacity: 1,
    y: 0,
    duration: T.base,
    ease: EASE.out,
  });

  batch(".u-reveal-fade", {
    opacity: 1,
    duration: T.slow,
    ease: EASE.inOut,
  });

  batch(".u-mask-lines > *", {
    yPercent: 0,
    duration: T.reveal,
    ease: EASE.mask,
  });

  return () => {
    for (const trigger of triggers) trigger.kill();
  };
}

/**
 * Scroll-highlight paragraph: each `.word` brightens as it passes the middle
 * of the viewport. Driven by a single scrubbed trigger that flips a data
 * attribute, so colour transitions stay in CSS.
 */
export function initWordHighlight(container: HTMLElement | null): () => void {
  if (!container) return () => {};

  const words = Array.from(container.querySelectorAll<HTMLElement>(".word"));
  if (words.length === 0) return () => {};

  if (!motionEnabled()) {
    for (const word of words) word.dataset.lit = "true";
    return () => {};
  }

  const trigger = ScrollTrigger.create({
    trigger: container,
    start: "top 78%",
    end: "bottom 55%",
    scrub: true,
    onUpdate: (self) => {
      const lit = Math.round(self.progress * words.length);
      for (let index = 0; index < words.length; index += 1) {
        const shouldLight = index < lit;
        const element = words[index];
        if (!element) continue;
        if ((element.dataset.lit === "true") !== shouldLight) {
          element.dataset.lit = shouldLight ? "true" : "false";
        }
      }
    },
  });

  return () => trigger.kill();
}

/** Horizontal rule that draws itself in as a section arrives. */
export function initRuleDraws(scope: HTMLElement | Document): () => void {
  if (!motionEnabled()) return () => {};

  const rules = Array.from(
    scope.querySelectorAll<HTMLElement>("[data-draw-rule]"),
  );
  if (rules.length === 0) return () => {};

  const tweens = rules.map((rule) =>
    gsap.fromTo(
      rule,
      { scaleX: 0, transformOrigin: "left center" },
      {
        scaleX: 1,
        duration: T.slow,
        ease: EASE.outExpo,
        scrollTrigger: { trigger: rule, start: "top 92%", once: true },
      },
    ),
  );

  return () => {
    for (const tween of tweens) {
      tween.scrollTrigger?.kill();
      tween.kill();
    }
  };
}

/** Call after fonts load or layout changes so trigger positions stay correct. */
export const refreshScrollTriggers = (): void => ScrollTrigger.refresh();
