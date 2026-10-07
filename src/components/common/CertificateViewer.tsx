import { useGSAP } from "@gsap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "../../animations/gsapSetup";
import { resolveAsset, type CaptionedAsset } from "../../config/assets";
import { Icon } from "./Icon";

/**
 * CERTIFICATE VIEWER
 * ==================
 * A preview frame that opens the full certificate in a modal.
 *
 * Built on the native `<dialog>` element, so Escape-to-close, the top layer,
 * the backdrop and the focus trap are the platform's job rather than three
 * hundred lines of ours — and no dependency is added for a lightbox. The only
 * things handled here are opening it (`showModal`), closing on a backdrop
 * click, and keeping React state in sync with a dialog the user can close
 * without going through us (the `close` event).
 *
 * Renders NOTHING when the asset has not been supplied. That is deliberate:
 * an empty certificate frame implies a document exists, and a placeholder
 * certificate would be a forgery. Unready slots simply do not appear.
 *
 * `prefers-reduced-motion` is handled in CSS — the open animation is dropped,
 * the dialog is not.
 *
 * The ↗ marks turn slowly and continuously from mount — one GSAP tween per
 * viewer, never tied to a click, so opening the dialog neither starts nor
 * restarts it. Under reduced motion the tween is never created and the marks
 * stay at rest.
 */

/** Seconds per full turn of the ↗ marks — slow enough to read as ambient. */
const ICON_SPIN_SECONDS = 10;
export interface CertificateViewerProps {
  asset: CaptionedAsset | null;
  /** Names the document in the trigger's accessible label. */
  title: string;
  /**
   * CTA text. Defaults to "View certificate" — pass something else for a
   * visual that is not a certificate, e.g. an award photograph, so the
   * control never mislabels what it opens.
   */
  actionLabel?: string;
}

export function CertificateViewer({
  asset,
  title,
  actionLabel = "View certificate",
}: CertificateViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const figureRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const src = resolveAsset(asset ?? undefined);

  const close = useCallback(() => dialogRef.current?.close(), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // The user can dismiss with Escape, which never routes through `close()`.
    const onClose = () => setOpen(false);
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

  const openDialog = () => {
    dialogRef.current?.showModal();
    setOpen(true);
  };

  /* Declared before the early return so the hook order is stable. Keyed on
     `src` only: `open` changes on every click, and the spin must not restart
     with it. The matchMedia scope reverts the tween — and the rotation it
     wrote — on unmount, or the moment reduced motion is switched on. */
  useGSAP(
    () => {
      const figure = figureRef.current;
      if (!figure) return;

      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(figure.querySelectorAll(".cert__spin svg"), {
          rotation: 360,
          transformOrigin: "50% 50%",
          duration: ICON_SPIN_SECONDS,
          ease: "none",
          repeat: -1,
        });
      });

      return () => media.revert();
    },
    { dependencies: [src] },
  );

  if (!asset || !src) return null;

  const label = `${asset.caption} — ${title}`;

  return (
    <>
      <figure className="cert" ref={figureRef}>
        <button
          className="cert__frame"
          type="button"
          onClick={openDialog}
          aria-label={`View ${label} at full size`}
          data-cursor="view"
          data-cursor-label="View"
        >
          <img src={src} alt={asset.alt ?? label} loading="lazy" decoding="async" />
          <span className="cert__hint" aria-hidden="true">
            View certificate
            <Icon name="arrow-up-right" className="cert__spin" />
          </span>
        </button>
        <figcaption className="cert__caption">{asset.caption}</figcaption>

        {/*
          An explicit CTA as well as the clickable thumbnail. Both open the
          same dialog — the component owns it, so there is one viewer per
          certificate rather than two competing ones.
        */}
        <button
          className="btn btn--sm cert__action"
          type="button"
          onClick={openDialog}
          aria-label={`${actionLabel}: ${label}`}
        >
          <span className="btn__fill" aria-hidden="true" />
          <span>{actionLabel}</span>
          <Icon name="arrow-up-right" className="cert__spin" />
        </button>
      </figure>

      <dialog
        className="lightbox"
        ref={dialogRef}
        aria-label={label}
        /* A click on the dialog itself is a click on the backdrop — the
           content sits in the inner figure, which stops propagation. */
        onClick={close}
      >
        <figure
          className="lightbox__inner"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            className="lightbox__close"
            type="button"
            onClick={close}
            aria-label="Close certificate"
          >
            <span aria-hidden="true">Close</span>
            <Icon name="chevron-right" />
          </button>

          {/* Mounted only while open, so a closed dialog costs no decode. */}
          {open ? (
            <img
              className="lightbox__image"
              src={src}
              alt={asset.alt ?? label}
              decoding="async"
            />
          ) : null}

          <figcaption className="lightbox__caption">{label}</figcaption>
        </figure>
      </dialog>
    </>
  );
}
