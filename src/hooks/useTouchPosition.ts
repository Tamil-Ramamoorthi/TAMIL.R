import { useEffect, useState } from "react";
import {
  getPointer,
  startPointerTracking,
  subscribePointer,
  type PointerState,
} from "./pointerStore";

/**
 * Touch-facing view of the same pointer store.
 *
 * On touch devices the Phase 2 reveal follows the finger rather than a cursor,
 * so interactions need to know which input most recently drove the position.
 * `isTouch` re-renders at most once per frame, and only when it actually
 * flips — the coordinates themselves stay render-free.
 */
export function useTouchPosition(): {
  pointer: Readonly<PointerState>;
  isTouch: boolean;
} {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    startPointerTracking();
    return subscribePointer((state) => {
      setIsTouch((previous) =>
        previous === state.isTouch ? previous : state.isTouch,
      );
    });
  }, []);

  return { pointer: getPointer(), isTouch };
}

/** True when the device reports no fine pointer (phones, most tablets). */
export function isCoarsePointer(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(pointer: coarse)").matches;
}
