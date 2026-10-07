# Certificate images

Supporting images for the Achievements, Certifications & Research section.

Four files are live. The rest of the slots are declared in
`src/data/achievements.ts` but are both `ready: false` AND `active: false`, so
their entries are filtered out of the render entirely — the section is curated,
not exhaustive, and nothing appears as an empty or broken row. Nothing here is
faked: a placeholder certificate would be a forgery.

## Live files

Built by `scripts/prepare-achievement-assets.py` from originals in `~/Downloads`,
which are read-only and untouched:

| File                               | Processing applied                                   |
| ---------------------------------- | ---------------------------------------------------- |
| `marcello-tech-internship.jpg`     | Rotated upright; left background trimmed; **certificate number blurred** |
| `overall-topper-certificate.jpg`   | Rotated upright; margins trimmed. No identifiers present |
| `overall-topper-award.jpg`         | Screenshot chrome (carousel arrow, viewer border) cropped off |
| `research-icriet-2026.jpg`         | Screenshot margin trimmed                            |

Re-run with `python scripts/prepare-achievement-assets.py` to regenerate.

## Privacy rules — read before adding any file

These are photographs of real documents. Crop or cover, before the file goes in
this folder:

- QR codes
- certificate / serial numbers
- registration or roll numbers
- date of birth
- candidate or cadet identifiers
- any other document-specific identifier

Keep visible: the title, the issuing organisation, the award or recognition,
the date, and the official branding and design.

**Never alter the certificate's factual text** — not a grade, a ranking, a name,
a date or a signature. Cropping and covering identifiers is the only editing
permitted. The data model in `src/data/achievements.ts` has no field for a
serial number, a registration number, a DOB or a candidate ID, and none should
be added.

## Expected files

| File                            | Entry                                   |
| ------------------------------- | --------------------------------------- |
| `overall-topper.jpg`            | Overall Topper in Academic Results      |
| `techno-2k25.jpg`               | Runner-Up — Techno 2K25                 |
| `marcello-tech-internship.jpg`  | MarcelloTech AI & ML internship         |
| `codealpha-certificate.jpg`     | CodeAlpha ML internship                 |
| `ncc-certificate-a.jpg`         | NCC Certificate A                       |
| `typewriting-english.jpg`       | Junior Grade Typewriting — English      |
| `technical-workshop.jpg`        | Technical workshop                      |
| `hackmatrix-2026.jpg`           | HackMatrix 2026                         |
| `inexora-24h-hackathon.jpg`     | INEXORA 24 Hours Hackathon              |
| `jct-sdg-hackathon-2026.jpg`    | JCT SDG Hackathon 2026                  |

`codealpha-certificate.jpg` is also declared under
`public/images/experience/` for the Experience section's own media column. The
same cropped file serves both; put a copy in each folder, or supply only one and
leave the other slot unready.

The research entry has no certificate slot — no paper file or publication URL
exists in the project, and neither is invented.

## To add one

1. Crop per the rules above and save a **web-ready copy** at the path in the
   table. Keep your originals elsewhere; do not overwrite them.
2. Around 1600px on the long edge is plenty. Correct the orientation.
3. In `src/data/achievements.ts`, pass `true` as the last argument to that
   `achievementAsset(...)` call.

No component or stylesheet changes. The preview frame appears, crops to 4:3 for
alignment with its neighbours, and opens the full image in the `<dialog>`
lightbox.
