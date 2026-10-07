/** ANIMATION BARREL */

export {
  gsap,
  ScrollTrigger,
  setupGsap,
  motionEnabled,
  enableAnimatedStates,
  T,
  EASE,
} from "./gsapSetup";

export { clamp, lerp, damp, mapRange, smoothstep, pad2 } from "./math";

export {
  animateCounter,
  preloaderIntro,
  preloaderExit,
} from "./preloader";
export type { PreloaderElements, PreloaderOptions } from "./preloader";

export { heroIntro, heroScrollCue, heroParallax } from "./hero";
export type { HeroElements } from "./hero";

export { initHeroReveal, REVEAL_VIEWBOX } from "./heroReveal";
export type { HeroRevealElements } from "./heroReveal";

export { navbarIntro, menuOpen, menuClose } from "./navigation";
export type { MenuElements } from "./navigation";

export {
  initScrollReveals,
  initWordHighlight,
  initRuleDraws,
  refreshScrollTriggers,
} from "./scroll";

export {
  gazeAnglesTo,
  createGazeAngles,
  vergenceYaw,
  breathe,
  settleOffset,
  createBlinkController,
} from "./characterTracking";
export type {
  GazeAngles,
  BlinkOptions,
  BlinkController,
} from "./characterTracking";

export { initCursor } from "./cursor";
export type { CursorState, CursorElements } from "./cursor";
