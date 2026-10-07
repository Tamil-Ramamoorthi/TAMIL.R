import { useEffect } from "react";

/**
 * Locks page scrolling while the preloader or mobile menu is open.
 * Reference-counted so two simultaneous locks cannot unlock each other.
 */
let locks = 0;

export function useLockBodyScroll(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    locks += 1;
    document.body.dataset.scrollLocked = "true";

    return () => {
      locks = Math.max(0, locks - 1);
      if (locks === 0) delete document.body.dataset.scrollLocked;
    };
  }, [locked]);
}
