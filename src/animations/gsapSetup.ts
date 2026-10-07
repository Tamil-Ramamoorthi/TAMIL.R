/**
 * GSAP SETUP
 * ==========
 * Registers plugins once, sets project-wide defaults, and owns the single
 * source of truth for "is motion allowed".
 *
 * Every animation factory in this folder follows the same contract:
 *   - it takes the elements it needs,
 *   - it returns a cleanup function (or a timeline),
 *   - and when motion is disabled it applies the FINAL state immediately
 *     instead of animating, so content is never left hidden.
 *
 * Components call these through `useGSAP` from @gsap/react, which scopes and
 * reverts everything on unmount.
 */

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "../hooks/useReducedMotion";

let initialised = false;

export function setupGsap(): void {
  if (initialised) return;
  initialised = true;

  // useGSAP is registered so GSAP can scope contexts without warning.
  gsap.registerPlugin(useGSAP, ScrollTrigger);

  gsap.defaults({
    ease: "power3.out",
    duration: 0.9,
  });

  gsap.config({
    nullTargetWarn: false,
    force3D: true,
  });

  // Mobile browsers resize the viewport when the URL bar hides; re-measuring
  // on every one of those causes visible jumps.
  ScrollTrigger.config({
    ignoreMobileResize: true,
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
  });
}

/** True when animations should actually play. */
export const motionEnabled = (): boolean => !prefersReducedMotion();

/**
 * Marks <html> so the stylesheets may apply hidden initial states.
 * Without this class every `.u-reveal` element stays visible — which is what
 * keeps the site readable with JS disabled or motion reduced.
 */
export function enableAnimatedStates(): void {
  if (motionEnabled()) {
    document.documentElement.classList.add("anim-ready");
  }
}

/** Shared timings so sections feel like one orchestrated system. */
export const T = {
  fast: 0.4,
  base: 0.7,
  slow: 1.1,
  reveal: 1.2,
  stagger: 0.07,
  staggerSlow: 0.12,
} as const;

export const EASE = {
  out: "power3.out",
  outExpo: "expo.out",
  inOut: "power2.inOut",
  mask: "power4.out",
} as const;

export { gsap, ScrollTrigger };
