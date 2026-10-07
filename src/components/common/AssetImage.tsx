import { resolveAsset, type AssetRef } from "../../config/assets";
import {
  AssetPlaceholder,
  type PlaceholderRatio,
} from "./AssetPlaceholder";

/**
 * Renders a declared asset, or its placeholder when the file is not in yet.
 * Components never build image URLs themselves — they pass an `AssetRef`.
 */
export interface AssetImageProps {
  asset: AssetRef;
  ratio?: PlaceholderRatio;
  className?: string;
  /** Images below the fold stay lazy; the hero pair can opt out. */
  priority?: boolean;
  sizes?: string;
}

export function AssetImage({
  asset,
  ratio = "video",
  className,
  priority = false,
  sizes,
}: AssetImageProps) {
  const src = resolveAsset(asset);

  if (!src) {
    return <AssetPlaceholder asset={asset} ratio={ratio} className={className} />;
  }

  return (
    <img
      className={className}
      src={src}
      alt={asset.alt ?? ""}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      {...(sizes ? { sizes } : {})}
    />
  );
}
