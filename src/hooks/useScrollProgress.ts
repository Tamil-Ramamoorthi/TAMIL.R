import { useEffect, useState } from "react";

/**
 * SCROLL STORE
 * One passive scroll listener for the whole app, sampled on an animation frame
 * so nothing reads layout mid-event. Animated consumers read the live object;
 * the few pieces of UI that genuinely need React state (navbar condense, scroll
 * cue) use the reactive helpers below.
 */

export interface ScrollState {
  /** Scroll offset in pixels. */
  y: number;
  /** 0..1 through the whole document. */
  progress: number;
  /** 1 = scrolling down, -1 = up, 0 = idle. */
  direction: number;
  /** Pixels moved since the previous sample. */
  delta: number;
}

const state: ScrollState = { y: 0, progress: 0, direction: 0, delta: 0 };

type Listener = (state: Readonly<ScrollState>) => void;
const listeners = new Set<Listener>();

let started = false;
let queued = false;

function measure(): void {
  queued = false;
  const y = window.scrollY || document.documentElement.scrollTop || 0;
  const max = Math.max(
    1,
    document.documentElement.scrollHeight - window.innerHeight,
  );

  state.delta = y - state.y;
  state.direction = state.delta === 0 ? 0 : state.delta > 0 ? 1 : -1;
  state.y = y;
  state.progress = Math.min(1, Math.max(0, y / max));

  for (const listener of listeners) listener(state);
}

function onScroll(): void {
  if (queued) return;
  queued = true;
  requestAnimationFrame(measure);
}

function startScrollTracking(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  measure();
}

export const getScroll = (): Readonly<ScrollState> => state;

export function subscribeScroll(listener: Listener): () => void {
  startScrollTracking();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The live scroll state object — read it inside an animation loop. */
export function useScrollProgress(): Readonly<ScrollState> {
  useEffect(() => {
    startScrollTracking();
  }, []);

  return state;
}

/**
 * Reactive: true once the page is scrolled past `threshold` pixels.
 * Re-renders only when the boolean flips.
 */
export function useScrollPast(threshold: number): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    return subscribeScroll((scroll) => {
      const next = scroll.y > threshold;
      setPast((previous) => (previous === next ? previous : next));
    });
  }, [threshold]);

  return past;
}
