import { useGSAP } from "@gsap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { navbarIntro } from "../../animations/navigation";
import { assets, resolveAsset } from "../../config/assets";
import { navOrder, navSections } from "../../config/site";
import { personal } from "../../data";
import { useActiveSection } from "../../hooks/useActiveSection";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import { useScrollPast } from "../../hooks/useScrollProgress";
import { ActionLink } from "../common/ActionLink";
import { MobileMenu } from "./MobileMenu";
import { NavLink } from "./NavLink";

/**
 * NAVBAR
 * Minimal and professional: a wordmark, five links, a resume action.
 *
 * The link rollover is CSS. GSAP handles only the entrance, which is held back
 * until the preloader hands over so the whole intro reads as one sequence.
 */
export interface NavbarProps {
  /** True once the preloader has finished. */
  booted: boolean;
}

export function Navbar({ booted }: NavbarProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const condensed = useScrollPast(80);
  const active = useActiveSection(navOrder);

  useLockBodyScroll(menuOpen);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const onClosed = useCallback(() => {}, []);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || !booted) return;
      navbarIntro(root);
    },
    { dependencies: [booted] },
  );

  // Escape closes the menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <>
      <header
        className="nav"
        ref={rootRef}
        data-condensed={condensed ? "true" : "false"}
      >
        <div className="nav__inner">
          <a className="nav__brand" href="#hero" data-nav-item>
            <span>{personal.shortName}</span>
            <span className="nav__brand-dot" aria-hidden="true" />
          </a>

          <nav className="nav__links" aria-label="Sections">
            {navSections.map((section) => (
              <NavLink
                key={section.id}
                href={`#${section.id}`}
                label={section.navLabel ?? section.title}
                active={active === section.id}
              />
            ))}
          </nav>

          <div className="nav__actions">
            <span className="u-only-desktop" data-nav-item>
              <ActionLink
                href={resolveAsset(assets.resume)}
                label="Resume"
                size="sm"
                variant="ghost"
                external
                pendingHint="Resume PDF not supplied yet"
              />
            </span>

            <button
              className="nav__burger"
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="nav__burger-bars" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} onClosed={onClosed} />
    </>
  );
}
