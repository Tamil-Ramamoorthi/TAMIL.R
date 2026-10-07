# Research paper

Assets for the Research / Publication card in the Achievements section.
Declared in `src/config/assets.ts` under `assets.research`.

`ai-ml-in-smart-production.pdf` is supplied — the author's own paper, copied
in unmodified — and the "Read paper" control opens it in a new tab. The
first-page preview has not been supplied, so the card has no document preview.

## Expected files

| File                                   | What it is                                  |
| -------------------------------------- | ------------------------------------------- |
| `ai-ml-in-smart-production.pdf`        | The conference paper itself                 |
| `ai-ml-in-smart-production-p1.jpg`     | An export of the paper's **own first page** |

The preview must be a render of page 1 of the PDF — not a designed cover, and
never fabricated journal front matter, a publisher mark or an indexing badge.
If no page export is supplied, the card renders fine without one.

## To switch the preview on

1. Drop `ai-ml-in-smart-production-p1.jpg` at the path above.
2. In `src/config/assets.ts`, add `ready: true` to the `cover` asset's options.

No component or stylesheet changes.

## Content rule

The card states the conference, the domain, the analytical methods and the
databases the study draws from. Those databases are labelled **"Data
analysed"** — Scopus and Web of Science are the study's data sources, *not* a
claim that this paper is indexed in either. Do not relabel that field, and do
not add a DOI, journal, publisher, volume, issue, page range or citation count:
none was supplied.
