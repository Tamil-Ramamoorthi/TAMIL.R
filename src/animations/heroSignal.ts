/**
 * HERO SIGNAL
 * ===========
 * One number, shared between the two halves of the hero's interactive layer.
 *
 * The technology orbit is DOM, driven by a `gsap.ticker` callback. The AI
 * tracker is WebGL, driven by an R3F `useFrame`. They run on different clocks
 * and neither can import the other without dragging a lazily-loaded chunk into
 * the wrong bundle — but they are meant to read as ONE system: the tracker is
 * the core, the icons are what orbits it.
 *
 * So the orbit writes its attention level here and the tracker reads it. A
 * module-level scalar, exactly like `pointerStore`: no event, no subscription,
 * no React state, and no render. If the orbit never mounts, this stays 0 and
 * the tracker behaves exactly as it would alone.
 */

const signal = { orbitFocus: 0 };

/** Called by the orbit each frame. 0 = idle, 1 = an icon is being attended to. */
export function setOrbitFocus(value: number): void {
  signal.orbitFocus = value < 0 ? 0 : value > 1 ? 1 : value;
}

/** Read inside a frame loop. */
export function getOrbitFocus(): number {
  return signal.orbitFocus;
}

/** Called when the orbit unmounts, so the tracker is not left energised. */
export function clearOrbitFocus(): void {
  signal.orbitFocus = 0;
}
