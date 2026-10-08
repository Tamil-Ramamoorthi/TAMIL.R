# images/

| File | Used for | Notes |
| --- | --- | --- |
| `hero-clean.jpg` | Hero — clean professional identity | **Supplied.** 777 x 971 (4:5), flattened onto `--c-bg-2`. Crop anchored by `focus` in `src/config/assets.ts` |
| `hero-clean.png` | Same portrait, real alpha | **Supplied.** 777 x 971 (4:5), transparent background. Not referenced yet |
| `hero-ai.jpg` | Hero — futuristic AI identity | **Supplied.** 777 x 971 (4:5). Derived from the same photograph, so it aligns with `hero-clean.jpg` pixel for pixel. `ready` stays `false` until Phase 2C |
| `portrait.jpg` | About section portrait | Portrait crop (3:4) |
| `og.jpg` | Social preview | 1200 x 630 |
| `projects/<project-id>/*.jpg` | Project screenshots | See `projects/README.md` |

The two hero images are used by the Phase 2 cursor reveal, which only moves a
mask — neither image is ever scaled, moved or rotated independently, so any
mismatch in size or framing will show.

`hero-ai.jpg` is therefore not a separate render. It is a treatment applied to
the very same photograph — grading and overlay layers only, no resize, crop,
rotation or warp — which is the only way to guarantee the two layers agree
pixel for pixel. Verify any replacement with:

```
python scripts/check-hero-alignment.py
```

## How `hero-clean` was made

Both files are produced by `scripts/prepare-portrait.py`, which is
deterministic — re-run it to regenerate them, then rebuild the AI layer:

```
python scripts/prepare-portrait.py
python scripts/make-hero-ai.py
```

Its source is the original studio photograph, kept byte-for-byte at
`scripts/source/hero-portrait.jpg` (3072 x 2048, white backdrop). It lives
outside `public/` so the full-resolution original is never shipped. A person
matte, refined with an exact white-backdrop estimate at the hair outline,
places the subject on `--c-bg-2`; the crop keeps the previous plate's 48 px
headroom and is scaled uniformly to 777 x 971 (about 2x supersampled). A light
finish (chroma denoise, gentle tone curve, restrained luminance-only
sharpening) adds no detail and moves no pixel. The subject is never generated,
warped or reshaped.

`scripts/extract-portrait.py` is the earlier producer, which cut the portrait
out of the design mockup in `public/references/`. It is kept for reference
only: running it would overwrite the plates with the mockup portrait.

`scripts/.cache/` holds the ~176 MB segmentation model; it is gitignored and
re-downloads on demand.

After adding a file, flip its `ready` flag in `src/config/assets.ts`.
