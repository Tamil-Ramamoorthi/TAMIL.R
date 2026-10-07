import { useEffect } from "react";
import {
  getPointer,
  startPointerTracking,
  subscribePointer,
  type PointerState,
} from "./pointerStore";

/**
 * Returns the live pointer state object (never a snapshot, never a render).
 *
 * Read it inside your own rAF loop or an R3F `useFrame`:
 *
 *   const pointer = useMousePosition();
 *   useFrame(() => { group.rotation.y += (pointer.nx * 0.2 - group.rotation.y) * 0.08; });
 */
export function useMousePosition(): Readonly<PointerState> {
  useEffect(() => {
    startPointerTracking();
  }, []);

  return getPointer();
}

/**
 * Imperative subscription, coalesced to one call per animation frame.
 * Use for side effects only — it deliberately does not cause a re-render.
 */
export function usePointerEffect(
  callback: (state: Readonly<PointerState>) => void,
): void {
  useEffect(() => {
    startPointerTracking();
    return subscribePointer(callback);
  }, [callback]);
}
