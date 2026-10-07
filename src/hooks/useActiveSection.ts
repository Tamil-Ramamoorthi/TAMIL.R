import { useEffect, useState } from "react";
import type { SectionId } from "../config/site";

/**
 * Scroll-spy for the navbar.
 *
 * Uses IntersectionObserver rather than scroll maths, so it costs nothing on
 * the main thread and updates at most a handful of times per page.
 */
export function useActiveSection(
  ids: readonly SectionId[],
  options: { rootMargin?: string } = {},
): SectionId | null {
  const [active, setActive] = useState<SectionId | null>(null);
  const { rootMargin = "-45% 0px -50% 0px" } = options;
  const key = ids.join(",");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const elements = key
      .split(",")
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id as SectionId);
          }
        }
      },
      { rootMargin, threshold: 0 },
    );

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [key, rootMargin]);

  return active;
}

/** Scrolls to a section, honouring the sticky navbar offset via CSS. */
export function scrollToSection(id: string): void {
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start",
  });
}
