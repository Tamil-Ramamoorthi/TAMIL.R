import { Environment } from "@react-three/drei";
import { assets, publicUrl } from "../../config/assets";

/**
 * HDR environment lighting, isolated in its own module so drei's Environment
 * (and the HDR loader behind it) is code-split out of the main scene chunk.
 * Only fetched when `features.hdrLighting` is on and a real `.hdr` exists.
 */
export function HdrEnvironment() {
  return (
    <Environment files={publicUrl(assets.hero.hdr.path)} background={false} />
  );
}

export default HdrEnvironment;
