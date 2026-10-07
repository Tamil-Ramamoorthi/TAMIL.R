import { useEffect, useMemo } from "react";
import {
  breakpoints,
  qualityBudgets,
  type QualityBudget,
  type QualityTier,
} from "../config/site";
import { useMediaQuery } from "./useMediaQuery";
import { useReducedMotion } from "./useReducedMotion";

/* ==========================================================================
   WEBGL DETECTION
   Probed once per page load with a throwaway canvas. If this returns false the
   site must still be fully usable — every WebGL surface has a CSS fallback.
   ========================================================================== */

let webglSupport: boolean | null = null;

export function detectWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  if (typeof document === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    webglSupport = Boolean(context);
  } catch {
    webglSupport = false;
  }

  return webglSupport;
}

/* ==========================================================================
   CAPABILITIES
   ========================================================================== */

export interface DeviceCapabilities {
  readonly isMobile: boolean;
  readonly isTablet: boolean;
  readonly isDesktop: boolean;
  /** Coarse pointer — phones and most tablets. */
  readonly isTouch: boolean;
  readonly hasWebGL: boolean;
  readonly reducedMotion: boolean;
  readonly tier: QualityTier;
  readonly budget: QualityBudget;
  /** Custom cursor: fine pointer, motion allowed. */
  readonly canUseCustomCursor: boolean;
  /** Whether it is worth mounting the WebGL scene at all. */
  readonly canRender3D: boolean;
  /**
   * Whether this device should carry a 3D *figure*, as opposed to just the
   * environment backdrop.
   *
   * False below 48rem. A full-height character in a phone viewport either
   * crowds the headline and CTAs or shrinks to an unreadable smudge, and it is
   * the most expensive thing in the scene — so phones keep the cheap
   * environment and drop the figure. This is narrower than disabling the whole
   * canvas on purpose: the backdrop is what the hero's lighting and depth come
   * from, and it already shipped in earlier phases.
   */
  readonly canRender3DCharacter: boolean;
}

/** Rough hardware signal; both properties are optional in the DOM spec. */
function hardwareScore(): number {
  if (typeof navigator === "undefined") return 1;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  return Math.min(cores / 8, 1) * 0.5 + Math.min(memory / 8, 1) * 0.5;
}

/**
 * Single source of truth for "how much should we render here".
 *
 *   mobile  → low     (reduced particles, dpr 1, no shadows)
 *   tablet  → medium  (reduced 3D complexity)
 *   desktop → high    (full experience)
 *
 * Also writes `data-quality` onto <html> so the stylesheets can drop
 * backdrop filters and grain on weak devices.
 */
export function useDeviceCapabilities(): DeviceCapabilities {
  const isMobile = useMediaQuery(`(max-width: ${breakpoints.md - 1}px)`);
  const isTabletWidth = useMediaQuery(
    `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  );
  const isTouch = useMediaQuery("(pointer: coarse)");
  const reducedMotion = useReducedMotion();

  const capabilities = useMemo<DeviceCapabilities>(() => {
    const hasWebGL = detectWebGL();
    const isDesktop = !isMobile && !isTabletWidth;

    let tier: QualityTier;
    if (isMobile || !hasWebGL) {
      tier = "low";
    } else if (isTabletWidth || hardwareScore() < 0.45) {
      tier = "medium";
    } else {
      tier = "high";
    }

    // Reduced motion also means a reduced render budget.
    if (reducedMotion && tier === "high") tier = "medium";

    return {
      isMobile,
      isTablet: isTabletWidth,
      isDesktop,
      isTouch,
      hasWebGL,
      reducedMotion,
      tier,
      budget: qualityBudgets[tier],
      canUseCustomCursor: !isTouch && !reducedMotion,
      canRender3D: hasWebGL,
      canRender3DCharacter: hasWebGL && !isMobile,
    };
  }, [isMobile, isTabletWidth, isTouch, reducedMotion]);

  useEffect(() => {
    document.documentElement.dataset.quality = capabilities.tier;
  }, [capabilities.tier]);

  return capabilities;
}
