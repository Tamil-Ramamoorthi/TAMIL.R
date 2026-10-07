import type { TransformProgress } from "../../animations/heroTransformation";
import { features, type QualityBudget } from "../../config/site";
import { AITracker } from "./AITracker";
import { CharacterRig } from "../Character/CharacterRig";
import { CameraRig } from "./CameraRig";
import { Lighting } from "./Lighting";
import { Particles } from "./Particles";
import { WorkspaceEnvironment } from "./WorkspaceEnvironment";

/**
 * HERO SCENE CONTENTS
 * Everything inside the Canvas, in one place.
 *
 * THE 3D FIGURE IS GONE
 * ---------------------
 * The hero's interactive object is the AI tracker. The Character architecture
 * is intact and still typechecks, but nothing here mounts it: `CharacterScene`,
 * `AiTransformation` and the contact shadow were all part of the figure and
 * went with it, so no character geometry, lighting or shadow is created and
 * the GLB is never fetched. Flipping `features.character3D` back on is not
 * enough to restore it — that is deliberate, so the figure cannot reappear by
 * accident.
 *
 * `CharacterRig` STAYS, and is not misnamed by accident: it is the cursor
 * hierarchy for the WHOLE scene, not just a figure. The camera, the
 * environment, the particles and now the tracker all damp from the single
 * pointer read it performs each frame, and it is where the transformation
 * stages are derived. Removing it would mean four components each reading the
 * pointer for themselves.
 */
export interface HeroSceneProps {
  budget: QualityBudget;
  reducedMotion: boolean;
  /** Whether this device should carry the tracker at all. */
  showTracker: boolean;
  /** Transformation carrier. Absent when the feature is off. */
  progress?: TransformProgress;
}

export function HeroScene({
  budget,
  reducedMotion,
  showTracker,
  progress,
}: HeroSceneProps) {
  return (
    <CharacterRig
      budget={budget}
      reducedMotion={reducedMotion}
      progress={progress}
    >
      <CameraRig reducedMotion={reducedMotion} strength={budget.parallax} />

      <Lighting budget={budget} />

      <WorkspaceEnvironment budget={budget} />

      {features.particles ? (
        <Particles budget={budget} reducedMotion={reducedMotion} />
      ) : null}

      {showTracker ? (
        <AITracker budget={budget} reducedMotion={reducedMotion} />
      ) : null}
    </CharacterRig>
  );
}
