/**
 * CURSOR SYSTEM
 * =============
 * A two-part cursor (fast dot + lagging ring) driven entirely outside React.
 *
 * Position comes from the shared pointer store and is smoothed by
 * `gsap.quickTo`, so the dot tracks tightly while the ring trails with
 * inertia. State comes from the DOM: any element can declare
 *
 *   <a data-cursor="view" data-cursor-label="Open">
 *
 * and a single delegated listener picks it up — no per-element handlers.
 *
 * Mounted only when `canUseCustomCursor` is true (fine pointer, motion
 * allowed), so touch and reduced-motion users keep the native cursor.
 */

import { subscribePointer } from "../hooks/pointerStore";
import { gsap, motionEnabled } from "./gsapSetup";

export type CursorState = "default" | "hover" | "view" | "text";

export interface CursorElements {
  root: HTMLElement;
  dot: HTMLElement;
  ring: HTMLElement;
  label: HTMLElement;
}

const RING_SCALE: Record<CursorState, number> = {
  default: 1,
  hover: 1.55,
  view: 2.1,
  text: 0.6,
};

/**
 * Wires up the cursor. Returns a cleanup function that removes every listener
 * and kills every tween.
 */
export function initCursor(elements: CursorElements): () => void {
  const { root, dot, ring, label } = elements;

  if (!motionEnabled()) return () => {};

  document.documentElement.dataset.cursorActive = "true";

  // Separate durations are what create the dot/ring lag.
  const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2.out" });
  const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2.out" });
  const ringX = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3.out" });
  const ringY = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3.out" });

  gsap.set(root, { autoAlpha: 0 });
  let visible = false;

  const unsubscribe = subscribePointer((pointer) => {
    // A touch should never summon the desktop cursor.
    if (pointer.isTouch) {
      if (visible) {
        visible = false;
        gsap.to(root, { autoAlpha: 0, duration: 0.2 });
      }
      return;
    }

    dotX(pointer.x);
    dotY(pointer.y);
    ringX(pointer.x);
    ringY(pointer.y);

    const shouldShow = pointer.inside && pointer.moved;
    if (shouldShow !== visible) {
      visible = shouldShow;
      gsap.to(root, { autoAlpha: shouldShow ? 1 : 0, duration: 0.25 });
    }
  });

  /* ---------- State from the DOM ---------- */

  let state: CursorState = "default";

  const applyState = (next: CursorState, text: string) => {
    if (next === state && label.textContent === text) return;
    state = next;
    root.dataset.state = next;
    label.textContent = text;
    gsap.to(ring, {
      scale: RING_SCALE[next],
      duration: 0.4,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  const onPointerOver = (event: PointerEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const owner = target.closest<HTMLElement>("[data-cursor]");
    if (owner) {
      const next = (owner.dataset.cursor ?? "hover") as CursorState;
      applyState(
        next in RING_SCALE ? next : "hover",
        owner.dataset.cursorLabel ?? "",
      );
      return;
    }

    const interactive = target.closest(
      "a, button, [role='button'], input, textarea, select, summary",
    );
    applyState(interactive ? "hover" : "default", "");
  };

  document.addEventListener("pointerover", onPointerOver, { passive: true });

  return () => {
    unsubscribe();
    document.removeEventListener("pointerover", onPointerOver);
    gsap.killTweensOf([root, dot, ring]);
    delete document.documentElement.dataset.cursorActive;
  };
}
