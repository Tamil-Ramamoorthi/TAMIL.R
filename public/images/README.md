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

Both files are produced by `scripts/extract-portrait.py`, which is
deterministic — re-run it to regenerate them:

```
python scripts/extract-portrait.py
```

It takes the full hero mockup in `public/references/hero-design-reference.jpg`
and keeps only the photograph: the navbar, headline, CTAs, accent pills, ghost
typography, swooshes and pink backdrop are all removed by an alpha matte, and
the one piece of chrome printed over the subject ("( SCROLL TO EXPLORE )",
across the right shoulder) is inpainted. The subject itself is only cropped —
never generated, warped or reshaped. See the script's header for the full
stage list and for what the colour pass is and is not allowed to touch.

`scripts/.cache/` holds the ~176 MB segmentation model; it is gitignored and
re-downloads on demand.

After adding a file, flip its `ready` flag in `src/config/assets.ts`.
