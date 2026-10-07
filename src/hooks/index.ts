/** HOOKS BARREL */

export { useMousePosition, usePointerEffect } from "./useMousePosition";
export { useTouchPosition, isCoarsePointer } from "./useTouchPosition";
export {
  getPointer,
  getLocalPointer,
  subscribePointer,
  startPointerTracking,
  stopPointerTracking,
} from "./pointerStore";
export type { PointerState, LocalPointer } from "./pointerStore";

export {
  useScrollProgress,
  useScrollPast,
  getScroll,
  subscribeScroll,
} from "./useScrollProgress";
export type { ScrollState } from "./useScrollProgress";

export { useReducedMotion, prefersReducedMotion } from "./useReducedMotion";
export { useMediaQuery } from "./useMediaQuery";
export { useDeviceCapabilities, detectWebGL } from "./useDeviceCapabilities";
export type { DeviceCapabilities } from "./useDeviceCapabilities";

export { useActiveSection, scrollToSection } from "./useActiveSection";
export { useLockBodyScroll } from "./useLockBodyScroll";
export { useAppLoading, registerLoadTask } from "./useAppLoading";
export type { AppLoading, LoadPhase } from "./useAppLoading";
