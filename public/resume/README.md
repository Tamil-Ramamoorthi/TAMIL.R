# Resume

`Tamil-Ramamoorthi-Resume.pdf` — **supplied**. Copied in unmodified from the
source document; the PDF itself has never been generated, rewritten or edited
by the build.

Declared as `assets.resume` in `src/config/assets.ts` with `ready: true`, which
is what activates both resume controls:

- the navbar action ("Resume")
- the Contact section cell ("Open PDF")

Both go through the shared `ActionLink` primitive and open in a new tab with
`rel="noreferrer noopener"`.

## Replacing it

Overwrite the file at this path, keeping the filename. Nothing else changes —
the asset path, both CTAs and the deploy-base handling all follow.

If the file is ever removed, `resolveAsset()` returns null and both controls
fall back to a disabled "Resume pending" chip rather than a dead link.
