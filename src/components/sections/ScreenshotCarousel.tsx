import { useGSAP } from "@gsap/react";
import { useRef, useState } from "react";
import { gsap, motionEnabled } from "../../animations/gsapSetup";
import type { ProjectShot } from "../../config/assets";
import { AssetImage } from "../common/AssetImage";
import { Icon } from "../common/Icon";

/**
 * PROJECT SCREENSHOT CAROUSEL
 * Supports any number of shots per project. Slides are declared in
 * src/data/projects.ts and render as labelled placeholders until the real
 * images are dropped in — so the control surface is testable before any
 * screenshot exists.
 *
 * Images are lazy except the active one, and the track is moved with a single
 * transform rather than re-laying out the slides.
 */
export interface ScreenshotCarouselProps {
  shots: readonly ProjectShot[];
  label: string;
}

export function ScreenshotCarousel({ shots, label }: ScreenshotCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const count = shots.length;
  const active = shots[index];

  useGSAP(
    () => {
      const track = trackRef.current;
      if (!track) return;

      const xPercent = -index * 100;
      if (motionEnabled()) {
        gsap.to(track, { xPercent, duration: 0.7, ease: "power3.out" });
      } else {
        gsap.set(track, { xPercent });
      }
    },
    { dependencies: [index] },
  );

  if (count === 0) return null;

  const go = (next: number) =>
    setIndex(Math.min(Math.max(next, 0), count - 1));

  return (
    <div
      className="carousel"
      role="group"
      aria-roledescription="carousel"
      aria-label={`${label} screenshots`}
    >
      <div className="carousel__viewport">
        <div className="carousel__track" ref={trackRef}>
          {shots.map((shot, slideIndex) => (
            <div
              className="carousel__slide"
              key={shot.path}
              role="group"
              aria-roledescription="slide"
              aria-label={`${slideIndex + 1} of ${count} — ${shot.caption}`}
              {...(slideIndex === index ? {} : { "aria-hidden": true })}
            >
              <AssetImage
                asset={shot}
                ratio="video"
                priority={slideIndex === 0}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="carousel__bar">
        <div className="carousel__dots">
          {shots.map((shot, dotIndex) => (
            <button
              className="carousel__dot"
              type="button"
              key={shot.path}
              onClick={() => go(dotIndex)}
              aria-label={`Show ${shot.caption}`}
              {...(dotIndex === index ? { "aria-current": "true" } : {})}
            />
          ))}
          <span className="carousel__caption">
            {String(index + 1).padStart(2, "0")} {active?.caption}
          </span>
        </div>

        <div className="carousel__nav">
          <button
            className="carousel__btn"
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="Previous screenshot"
          >
            <Icon name="chevron-left" />
          </button>
          <button
            className="carousel__btn"
            type="button"
            onClick={() => go(index + 1)}
            disabled={index === count - 1}
            aria-label="Next screenshot"
          >
            <Icon name="chevron-right" />
          </button>
        </div>
      </div>
    </div>
  );
}
