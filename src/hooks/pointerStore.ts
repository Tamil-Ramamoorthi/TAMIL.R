/**
 * POINTER STORE
 * =============
 * One module-level store, one set of window listeners, zero React renders.
 *
 * Mouse and touch both feed the same state. Consumers that animate (the
 * cursor, the character rig, the Phase 2 reveal mask) read the live object
 * inside their own rAF / useFrame loop and interpolate towards it, which keeps
 * movement smooth and jitter-free without re-rendering the tree.
 *
 * React state is only involved via `subscribe()`, which fires at most once per
 * animation frame — use it sparingly.
 */

export interface PointerState {
  /** Viewport coordinates in CSS pixels. */
  x: number;
  y: number;
  /** Normalised to -1..1 across the viewport (0,0 = centre). */
  nx: number;
  ny: number;
  /** Pixels moved since the previous sample. */
  vx: number;
  vy: number;
  /** Magnitude of the velocity vector. */
  speed: number;
  /** False once the pointer leaves the window. */
  inside: boolean;
  /** True when the most recent sample came from a touch. */
  isTouch: boolean;
  /** False until the very first movement — lets visuals stay neutral. */
  moved: boolean;
  /** Timestamp of the last sample. */
  t: number;
}

type Listener = (state: Readonly<PointerState>) => void;

const state: PointerState = {
  x: 0,
  y: 0,
  nx: 0,
  ny: 0,
  vx: 0,
  vy: 0,
  speed: 0,
  inside: false,
  isTouch: false,
  moved: false,
  t: 0,
};

const listeners = new Set<Listener>();

let started = false;
let flushScheduled = false;

function scheduleFlush(): void {
  if (flushScheduled || listeners.size === 0) return;
  flushScheduled = true;
  requestAnimationFrame(() => {
    flushScheduled = false;
    for (const listener of listeners) listener(state);
  });
}

function sample(x: number, y: number, isTouch: boolean): void {
  const now = performance.now();
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;

  state.vx = state.moved ? x - state.x : 0;
  state.vy = state.moved ? y - state.y : 0;
  state.speed = Math.hypot(state.vx, state.vy);

  state.x = x;
  state.y = y;
  state.nx = (x / w) * 2 - 1;
  state.ny = -((y / h) * 2 - 1);
  state.inside = true;
  state.isTouch = isTouch;
  state.moved = true;
  state.t = now;

  scheduleFlush();
}

function onPointerMove(event: PointerEvent): void {
  sample(event.clientX, event.clientY, event.pointerType === "touch");
}

function onTouchMove(event: TouchEvent): void {
  const touch = event.touches[0];
  if (touch) sample(touch.clientX, touch.clientY, true);
}

function onLeave(): void {
  state.inside = false;
  state.vx = 0;
  state.vy = 0;
  state.speed = 0;
  scheduleFlush();
}

function onEnter(): void {
  state.inside = true;
  scheduleFlush();
}

/** Idempotent. Called by the hooks; safe to call from anywhere. */
export function startPointerTracking(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("pointerdown", onPointerMove, { passive: true });
  document.addEventListener("pointerleave", onLeave);
  document.addEventListener("pointerenter", onEnter);
  window.addEventListener("blur", onLeave);
}

export function stopPointerTracking(): void {
  if (!started) return;
  started = false;
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("touchmove", onTouchMove);
  window.removeEventListener("pointerdown", onPointerMove);
  document.removeEventListener("pointerleave", onLeave);
  document.removeEventListener("pointerenter", onEnter);
  window.removeEventListener("blur", onLeave);
}

/** The live, mutable state object. Read it inside an animation loop. */
export function getPointer(): Readonly<PointerState> {
  return state;
}

/** Subscribe to at most one notification per animation frame. */
export function subscribePointer(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Pointer position normalised to -1..1 inside a specific element, plus whether
 * the pointer is currently over it. Used by the hero reveal and the rig so the
 * interaction is anchored to the hero box rather than the whole viewport.
 */
export interface LocalPointer {
  /** 0..1 across the element. */
  u: number;
  v: number;
  /** -1..1 across the element. */
  nx: number;
  ny: number;
  over: boolean;
}

const local: LocalPointer = { u: 0.5, v: 0.5, nx: 0, ny: 0, over: false };

export function getLocalPointer(element: HTMLElement | null): LocalPointer {
  if (!element) return local;
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return local;

  const u = (state.x - rect.left) / rect.width;
  const v = (state.y - rect.top) / rect.height;

  local.u = u;
  local.v = v;
  local.nx = u * 2 - 1;
  local.ny = -(v * 2 - 1);
  local.over = state.inside && u >= 0 && u <= 1 && v >= 0 && v <= 1;

  return local;
}
