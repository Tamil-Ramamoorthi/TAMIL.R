"""
PREPARE ACHIEVEMENT ASSETS
==========================
Builds web-ready copies of the four supplied credential images into
`public/images/achievements/`. The originals in ~/Downloads are READ ONLY and
are never modified or moved.

WHAT THIS DOES, AND WHY
-----------------------
1. ORIENTATION. Both photographed certificates arrive rotated 90 degrees
   (their text runs bottom-to-top), so they are rotated 90 degrees clockwise
   into landscape. No other geometry is touched.

2. PRIVACY. The MarcelloTech certificate prints a certificate number in its
   top-right corner. For public display that corner is cropped away. Nothing
   else on any certificate is altered: no name, date, grade, award wording or
   signature is edited, moved or covered. Cropping is the only edit applied.

3. SCREENSHOT CHROME. The award photograph is a screenshot that includes a
   carousel arrow and viewer border down its left edge. That chrome is cropped
   off so the portfolio shows the photograph, not someone else's UI.

4. SIZE. Everything is capped at 1600px on the long edge and saved as
   progressive JPEG at quality 86 — plenty for a thumbnail that opens in a
   lightbox, and small enough not to bloat the page.

Run from the project root:  python -I scripts/prepare-achievement-assets.py
"""

from pathlib import Path
from PIL import Image, ImageFilter

SOURCE_DIR = Path.home() / "Downloads"
OUT_DIR = Path("public/images/achievements")

MAX_EDGE = 1600
QUALITY = 86


def load(name: str) -> Image.Image:
    path = SOURCE_DIR / name
    if not path.exists():
        raise SystemExit(f"Missing source file: {path}")
    return Image.open(path).convert("RGB")


def crop_fractions(
    image: Image.Image,
    left: float = 0.0,
    top: float = 0.0,
    right: float = 0.0,
    bottom: float = 0.0,
) -> Image.Image:
    """Crops by a fraction of each edge, so the numbers survive a resize."""
    width, height = image.size
    box = (
        int(width * left),
        int(height * top),
        int(width * (1 - right)),
        int(height * (1 - bottom)),
    )
    return image.crop(box)


def redact(
    image: Image.Image,
    left: float,
    top: float,
    right: float,
    bottom: float,
) -> Image.Image:
    """
    Blurs one rectangle, given as fractions of the image.

    Used ONLY to obscure a document identifier. A heavy blur is deliberate: it
    reads as a redaction, which is honest, where painting over the area would
    read as an unmarked alteration of the document. The "Certificate No:"
    label beside it is left legible so the redaction is self-evident.
    """
    width, height = image.size
    box = (
        int(width * left),
        int(height * top),
        int(width * right),
        int(height * bottom),
    )
    region = image.crop(box).filter(ImageFilter.GaussianBlur(14))
    image = image.copy()
    image.paste(region, box)
    return image


def save(image: Image.Image, filename: str) -> None:
    image.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    target = OUT_DIR / filename
    image.save(target, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    print(f"{target}  {image.size[0]}x{image.size[1]}")


def main() -> None:
    # 1. MarcelloTech internship certificate.
    #    Rotated upright, then the photographed background down the left edge
    #    is trimmed. The certificate number sits mid-right, inline with the
    #    body text, so it cannot be cropped without losing wording — it is
    #    blurred instead, leaving its "Certificate No:" label readable.
    intern = load("INTERN.jpeg").rotate(-90, expand=True)
    intern = crop_fractions(intern, left=0.12, right=0.03, top=0.02, bottom=0.03)
    intern = redact(intern, left=0.855, top=0.245, right=1.0, bottom=0.325)
    save(intern, "marcello-tech-internship.jpg")

    # 2. Overall Topper — Certificate of Merit.
    #    Orientation only. It carries no serial number, QR code or identifier,
    #    so nothing is cropped beyond a sliver of photographed background.
    merit = load("WhatsApp Image 2026-10-06 at 8.43.31 PM.jpeg").rotate(
        -90, expand=True
    )
    merit = crop_fractions(merit, left=0.01, right=0.01, top=0.01, bottom=0.02)
    save(merit, "overall-topper-certificate.jpg")

    # 3. Overall Topper — award photograph.
    #    Screenshot chrome down the left edge (a carousel arrow) and the thin
    #    viewer border are cropped off.
    award = load("Screenshot 2026-10-06 204830.png")
    award = crop_fractions(award, left=0.045, right=0.005, top=0.01, bottom=0.01)
    save(award, "overall-topper-award.jpg")

    # 4. ICRIET-2026 conference certificate.
    #    Already upright; only the screenshot's grey margin is trimmed.
    icriet = load("Screenshot 2026-10-06 204910.png")
    icriet = crop_fractions(
        icriet, left=0.012, right=0.012, top=0.015, bottom=0.015
    )
    save(icriet, "research-icriet-2026.jpg")


if __name__ == "__main__":
    main()
