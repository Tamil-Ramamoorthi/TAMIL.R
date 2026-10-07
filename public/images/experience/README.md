# Experience media

Certificates and role imagery for the Experience section.

Slots are declared in `src/data/experience.ts` via `experienceAsset()` and every
one is currently `ready: false`, so the Experience section renders with **no**
media column. Nothing is faked here — a placeholder certificate would be a
forgery, so unsupplied slots render nothing at all rather than scaffolding.

## Expected files

| File                               | Entry        | Caption                |
| ---------------------------------- | ------------ | ---------------------- |
| `marcello-tech-certificate.jpg`    | MarcelloTech | Internship certificate |
| `codealpha-certificate.jpg`        | CodeAlpha    | Internship certificate |
| `codealpha-project.jpg`            | CodeAlpha    | Project image          |

## To add one

1. Drop the real file at the path above.
2. In `src/data/experience.ts`, pass `true` as the last argument to that
   `experienceAsset(...)` call.

No component or stylesheet changes. The entry switches to a three-column
layout on its own at ≥70rem once at least one file is ready.

Keep scans legible but not enormous — around 1600px on the long edge is plenty;
the frame caps at 26rem and links to the full file in a new tab.
