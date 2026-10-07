import { AdaptiveDpr, AdaptiveEvents } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import type { TransformProgress } from "../../animations/heroTransformation";
import type { QualityBudget } from "../../config/site";
import { HeroScene } from "./HeroScene";

/**
 * SCENE CANVAS
 * ============
 * The only place `<Canvas>` is created. Lazy-imported by the hero, so three.js
 * and the R3F layer land in their own chunks and never block first paint.
 *
 * Performance guards:
 *   - `dpr` is capped by the device quality budget (2 → 1 on mobile).
 *   - `AdaptiveDpr` drops resolution further if the frame rate sags.
 *   - `frameloop="demand"` means a reduced-motion visitor renders one frame
 *     and then the GPU goes idle.
 *   - antialiasing and shadows are budget-gated.
 */
export interface SceneCanvasProps {
  budget: QualityBudget;
  reducedMotion: boolean;
  /** Passed through to the AI tracker slot. */
  showTracker: boolean;
  /** Phase 3B transformation carrier. */
  progress?: TransformProgress;
}

export function SceneCanvas({
  budget,
  reducedMotion,
  showTracker,
  progress,
}: SceneCanvasProps) {
  return (
    <Canvas
      dpr={[1, budget.maxDpr]}
      shadows={budget.shadows}
      frameloop={reducedMotion ? "demand" : "always"}
      camera={{ position: [0, 0.35, 4.8], fov: 36, near: 0.1, far: 60 }}
      gl={{
        antialias: budget.antialias,
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      onCreated={({ gl }) => {
        gl.setClearAlpha(0);
      }}
    >
      <Suspense fallback={null}>
        <HeroScene
          budget={budget}
          reducedMotion={reducedMotion}
          showTracker={showTracker}
          progress={progress}
        />
      </Suspense>

      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />
    </Canvas>
  );
}

export default SceneCanvas;
