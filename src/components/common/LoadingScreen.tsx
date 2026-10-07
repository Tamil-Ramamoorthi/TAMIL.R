import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import {
  animateCounter,
  preloaderExit,
  preloaderIntro,
} from "../../animations/preloader";
import { personal } from "../../data";
import { useAppLoading } from "../../hooks/useAppLoading";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";

/**
 * PRELOADER
 * Short, premium intro. It never blocks access longer than it has to:
 * `useAppLoading` waits only on fonts, the window load event and critical
 * images that actually exist, with a hard timeout as a backstop.
 */
export interface LoadingScreenProps {
  /** Called once the exit animation finishes; the parent then unmounts this. */
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);

  const { target, ready, phase } = useAppLoading();
  useLockBodyScroll(true);

  // Intro + counter: runs once on mount.
  useGSAP(() => {
    const root = rootRef.current;
    const content = contentRef.current;
    const counter = counterRef.current;
    const bar = barRef.current;
    const curtain = curtainRef.current;
    if (!root || !content || !counter || !bar || !curtain) return;

    const stopCounter = animateCounter({ counter, bar }, target);
    preloaderIntro({ root, content, counter, bar, curtain });

    return stopCounter;
  }, []);

  // Exit: fires when loading reports ready.
  useGSAP(
    () => {
      if (!ready) return;
      const root = rootRef.current;
      const content = contentRef.current;
      const counter = counterRef.current;
      const bar = barRef.current;
      const curtain = curtainRef.current;
      if (!root || !content || !counter || !bar || !curtain) return;

      preloaderExit({ root, content, counter, bar, curtain }, onComplete);
    },
    { dependencies: [ready, onComplete] },
  );

  return (
    <div
      className="preloader"
      ref={rootRef}
      data-done={ready ? "true" : "false"}
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio"
    >
      <div className="preloader__ghost u-decor" aria-hidden="true">
        <span>AI</span>
      </div>

      <div className="preloader__center" ref={contentRef}>
        <div className="u-clip">
          <h1 className="preloader__name" data-pre-line>
            {personal.shortName}
          </h1>
        </div>
        <div className="u-clip">
          <p className="preloader__tag" data-pre-line>
            AI &middot; Data &middot; Code
          </p>
        </div>
      </div>

      <div className="preloader__foot">
        <span className="preloader__status">
          {phase === "ready" ? "Ready" : "Loading"}
        </span>
        <span className="preloader__count">
          <span ref={counterRef}>00</span>
          <sup>%</sup>
        </span>
      </div>

      <div className="preloader__bar" aria-hidden="true">
        <span className="preloader__bar-fill" ref={barRef} />
      </div>

      <div className="preloader__curtain" ref={curtainRef} aria-hidden="true" />
    </div>
  );
}
