/**
 * NAVIGATION ANIMATIONS
 * The link rollover is pure CSS (cheap, no JS on hover). GSAP owns the intro
 * and the mobile menu, where a clip-path reveal needs sequencing.
 */

import { EASE, T, gsap, motionEnabled } from "./gsapSetup";

/** Navbar entrance, played after the preloader hands over. */
export function navbarIntro(root: HTMLElement): gsap.core.Timeline {
  const timeline = gsap.timeline();
  const items = root.querySelectorAll<HTMLElement>("[data-nav-item]");

  if (!motionEnabled()) {
    gsap.set(items, { opacity: 1, y: 0 });
    return timeline;
  }

  timeline.fromTo(
    items,
    { opacity: 0, y: -12 },
    { opacity: 1, y: 0, duration: T.base, ease: EASE.out, stagger: 0.05 },
  );

  return timeline;
}

export interface MenuElements {
  panel: HTMLElement;
  items: NodeListOf<HTMLElement> | HTMLElement[];
  foot?: HTMLElement | null;
}

/** Opens the mobile menu. Returns the timeline. */
export function menuOpen(elements: MenuElements): gsap.core.Timeline {
  const { panel, items, foot } = elements;
  const timeline = gsap.timeline();

  if (!motionEnabled()) {
    gsap.set(panel, { clipPath: "none", opacity: 1 });
    gsap.set(items, { opacity: 1, y: 0 });
    return timeline;
  }

  timeline
    .fromTo(
      panel,
      { clipPath: "inset(0% 0% 100% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: EASE.mask },
    )
    .fromTo(
      items,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.5, ease: EASE.out, stagger: 0.05 },
      "-=0.4",
    );

  if (foot) {
    timeline.fromTo(
      foot,
      { opacity: 0 },
      { opacity: 1, duration: 0.4 },
      "-=0.2",
    );
  }

  return timeline;
}

/** Closes the mobile menu, then calls `onDone` so React can unmount it. */
export function menuClose(
  elements: MenuElements,
  onDone: () => void,
): gsap.core.Timeline {
  const { panel, items } = elements;
  const timeline = gsap.timeline({ onComplete: onDone });

  if (!motionEnabled()) {
    timeline.to({}, { duration: 0.01 });
    return timeline;
  }

  timeline
    .to(items, { opacity: 0, y: -16, duration: 0.3, stagger: 0.03 })
    .to(
      panel,
      {
        clipPath: "inset(0% 0% 100% 0%)",
        duration: 0.55,
        ease: EASE.mask,
      },
      "-=0.15",
    );

  return timeline;
}
