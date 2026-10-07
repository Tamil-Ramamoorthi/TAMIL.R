# textures/

Optional. `studio.hdr` is used for HDR environment lighting in the hero scene.

To enable it:

1. Add the `.hdr` file here
2. `src/config/assets.ts` — set `hero.hdr.ready = true`
3. `src/config/site.ts` — set `features.hdrLighting = true`

Without it the scene uses the analytic three-point light rig in
`src/components/three/Lighting.tsx`, which is cheaper and already looks
correct. Only add an HDR if it measurably improves the render.
