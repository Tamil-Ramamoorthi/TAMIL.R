import { useGSAP } from "@gsap/react";
import { useRef, type ReactNode } from "react";
import {
  initRuleDraws,
  initScrollReveals,
  refreshScrollTriggers,
} from "../../animations/scroll";

/**
 * MAIN CONTAINER
 * Owns the single scroll surface and registers the section-reveal system once
 * for the whole page, rather than letting each section create its own
 * triggers. Reveals are additive — if this never runs, every section is simply
 * already visible.
 */
export interface MainContainerProps {
  children: ReactNode;
  /** Reveals are registered only after the preloader has handed over. */
  booted: boolean;
}

export function MainContainer({ children, booted }: MainContainerProps) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || !booted) return;

      const stopReveals = initScrollReveals(root);
      const stopRules = initRuleDraws(root);

      // Web fonts land after first paint and change element heights.
      const onFonts = () => refreshScrollTriggers();
      document.fonts?.ready.then(onFonts);

      return () => {
        stopReveals();
        stopRules();
      };
    },
    { dependencies: [booted] },
  );

  return (
    <>
      <a className="skip-link" href="#about">
        Skip to content
      </a>

      <main className="main" id="main" ref={rootRef}>
        {children}
      </main>

      <div className="overlay-grain u-decor" aria-hidden="true" />
      <div className="overlay-vignette u-decor" aria-hidden="true" />
    </>
  );
}
