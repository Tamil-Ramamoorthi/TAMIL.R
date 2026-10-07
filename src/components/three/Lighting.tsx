import { Suspense, lazy } from "react";
import { assets } from "../../config/assets";
import { features } from "../../config/site";
import type { QualityBudget } from "../../config/site";
import { scenePalette } from "./palette";

/** Code-split: the HDR loader is never downloaded unless it is actually used. */
const HdrEnvironment = lazy(() => import("./HdrEnvironment"));

/**
 * LIGHTING
 * A three-point setup plus one blue accent, which is where most of the
 * portfolio's blue lives. The HDR environment is opt-in: it only loads when a
 * real file has been supplied AND the feature flag is on, so the scene never
 * depends on an asset that may not exist.
 */
export interface LightingProps {
  budget: QualityBudget;
}

export function Lighting({ budget }: LightingProps) {
  const useHdr = features.hdrLighting && assets.hero.hdr.ready;

  return (
    <>
      <ambientLight intensity={0.35} color={scenePalette.warmFill} />

      {/* Key light — soft, front-left, slightly above eye line. */}
      <directionalLight
        position={[-3.2, 4.4, 4.2]}
        intensity={1.5}
        color={scenePalette.warmFill}
        castShadow={budget.shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />

      {/* Fill — keeps the shadow side readable rather than black. */}
      <directionalLight
        position={[3.6, 1.8, 2.4]}
        intensity={0.4}
        color="#aebbd6"
      />

      {/* Accent — reads as monitor spill. */}
      <pointLight
        position={[1.5, 1.2, 1.1]}
        intensity={6}
        distance={7}
        decay={2}
        color={scenePalette.accent}
      />

      {/* Rim — separates the subject from the background. */}
      <spotLight
        position={[0, 4.5, -4]}
        angle={0.75}
        penumbra={1}
        intensity={2.4}
        color={scenePalette.accentBright}
      />

      {useHdr ? (
        <Suspense fallback={null}>
          <HdrEnvironment />
        </Suspense>
      ) : null}
    </>
  );
}
