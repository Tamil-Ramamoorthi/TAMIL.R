/**
 * Static hero backdrop for devices without WebGL, or where the quality budget
 * says not to spend a GPU frame here. Pure CSS — no canvas, no JS loop.
 *
 * The site must remain complete without WebGL, so this is a real visual, not
 * an error state.
 */
export interface SceneFallbackProps {
  /** Shows a quiet note explaining why the 3D scene is absent. */
  reason?: "no-webgl" | "reduced" | null;
}

export function SceneFallback({ reason = null }: SceneFallbackProps) {
  return (
    <div className="scene-fallback u-decor" aria-hidden="true">
      <div className="scene-fallback__grid" />
      {reason === "no-webgl" ? (
        <p className="scene__notice">3D scene unavailable — WebGL off</p>
      ) : null}
    </div>
  );
}
