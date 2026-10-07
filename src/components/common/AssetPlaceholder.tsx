import type { AssetRef } from "../../config/assets";

/**
 * Scaffolding shown wherever a real asset has not been supplied yet.
 *
 * It names the expected file so the gap is self-documenting rather than a
 * broken image or, worse, a fabricated stand-in. Flipping `ready` to `true`
 * in src/config/assets.ts replaces it with the real file automatically.
 */
export type PlaceholderRatio = "portrait" | "video" | "square" | "fill";

export interface AssetPlaceholderProps {
  asset: AssetRef;
  ratio?: PlaceholderRatio;
  className?: string;
  center?: boolean;
}

const ratioClass: Record<PlaceholderRatio, string> = {
  portrait: "ph--ratio-portrait",
  video: "ph--ratio-video",
  square: "ph--ratio-square",
  fill: "ph--fill",
};

export function AssetPlaceholder({
  asset,
  ratio = "video",
  className,
  center = false,
}: AssetPlaceholderProps) {
  const classes = [
    "ph",
    ratioClass[ratio],
    center ? "ph--center" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role="img" aria-label={`${asset.label} — not yet supplied`}>
      <span className="ph__corner ph__corner--tl" aria-hidden="true" />
      <span className="ph__corner ph__corner--tr" aria-hidden="true" />
      <span className="ph__corner ph__corner--bl" aria-hidden="true" />
      <span className="ph__corner ph__corner--br" aria-hidden="true" />

      <span className="ph__kind">{asset.kind} slot</span>
      <span className="ph__label">{asset.label}</span>
      <span className="ph__path">public/{asset.path}</span>
    </div>
  );
}
