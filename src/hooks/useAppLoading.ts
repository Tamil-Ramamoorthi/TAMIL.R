import { useEffect, useRef, useState } from "react";
import { criticalAssets, resolveAsset } from "../config/assets";
import { preloader as preloaderConfig } from "../config/site";

/**
 * APP LOADING
 * ===========
 * Tracks how much of the *critical* boot work is done. Heavy, non-critical
 * assets (the character GLB, HDR, project screenshots) are deliberately NOT
 * waited on — they stream in behind the page.
 *
 * Only assets marked `ready` in src/config/assets.ts are fetched, so missing
 * files can never stall the preloader.
 *
 * The numeric counter is animated by `src/animations/preloader.ts`, which
 * reads `target.value` each frame. That keeps a 60fps counter out of React.
 */

export type LoadPhase = "fonts" | "assets" | "finalising" | "ready";

export interface AppLoading {
  /** Live object holding the 0..1 completion target. */
  readonly target: { value: number };
  /** True once critical work is done AND the minimum display time elapsed. */
  readonly ready: boolean;
  readonly phase: LoadPhase;
}

/** Extra weight the 3D layer can register once it starts loading real assets. */
let externalWeight = 0;
let externalDone = 0;

export function registerLoadTask(): () => void {
  externalWeight += 1;
  let settled = false;
  return () => {
    if (settled) return;
    settled = true;
    externalDone += 1;
  };
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve(); // never block boot on a bad asset
    image.src = url;
  });
}

export function useAppLoading(): AppLoading {
  const target = useRef<{ value: number }>({ value: 0 });
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<LoadPhase>("fonts");

  useEffect(() => {
    const startedAt = performance.now();
    let cancelled = false;

    const urls = criticalAssets
      .map((asset) => resolveAsset(asset))
      .filter((url): url is string => url !== null);

    // Weights: fonts + each ready critical image + window load + externals.
    const totalWeight = 1 + urls.length + 1 + externalWeight;
    let done = 0;

    const bump = (amount = 1) => {
      done += amount;
      target.current.value = Math.min(
        1,
        (done + externalDone) / Math.max(1, totalWeight),
      );
    };

    const finish = () => {
      if (cancelled) return;
      setPhase("finalising");
      const elapsed = performance.now() - startedAt;
      const wait = Math.max(0, preloaderConfig.minDurationMs - elapsed);
      window.setTimeout(() => {
        if (cancelled) return;
        target.current.value = 1;
        setPhase("ready");
        setReady(true);
      }, wait);
    };

    const fonts = document.fonts
      ? document.fonts.ready.then(() => {
          bump();
          if (!cancelled) setPhase("assets");
        })
      : Promise.resolve(bump());

    const windowLoad =
      document.readyState === "complete"
        ? Promise.resolve(bump())
        : new Promise<void>((resolve) => {
            window.addEventListener(
              "load",
              () => {
                bump();
                resolve();
              },
              { once: true },
            );
          });

    const images = Promise.all(
      urls.map((url) => preloadImage(url).then(() => bump())),
    );

    void Promise.all([fonts, windowLoad, images]).then(finish);

    // Hard ceiling — the site is never gated behind a slow network.
    const failsafe = window.setTimeout(finish, preloaderConfig.maxDurationMs);

    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
    };
  }, []);

  return { target: target.current, ready, phase };
}
