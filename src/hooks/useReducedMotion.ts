import { useMediaQuery } from "./useMediaQuery";

/**
 * `prefers-reduced-motion: reduce`.
 *
 * When true the site must: skip the preloader counter animation, drop the
 * custom cursor, disable eye/head tracking, remove parallax and run scroll
 * reveals as instant state changes. Content itself is never gated on motion.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** Synchronous read, for module code that runs outside React. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
