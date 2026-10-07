import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { menuClose, menuOpen } from "../../animations/navigation";
import { navSections } from "../../config/site";
import { personal, socials } from "../../data";

/**
 * Mobile menu. Stays mounted so GSAP can animate it both ways; `data-open`
 * plus the clip-path reveal handle visibility, and `inert` keeps the closed
 * panel out of the tab order.
 */
export interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  /** Flipped to false by the close animation so the panel can be hidden. */
  onClosed: () => void;
}

export function MobileMenu({ open, onClose, onClosed }: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const panel = panelRef.current;
      if (!panel) return;

      const items = panel.querySelectorAll<HTMLElement>("[data-menu-item]");

      if (open) {
        menuOpen({ panel, items, foot: footRef.current });
      } else {
        menuClose({ panel, items }, onClosed);
      }
    },
    { dependencies: [open] },
  );

  return (
    <div
      className="menu"
      ref={panelRef}
      data-open={open ? "true" : "false"}
      id="mobile-menu"
      aria-label="Site menu"
      {...(open ? {} : { inert: true })}
    >
      <nav className="menu__list">
        <ul>
          {navSections.map((section) => (
            <li className="menu__item" key={section.id}>
              <a
                className="menu__link"
                href={`#${section.id}`}
                data-menu-item
                onClick={onClose}
              >
                <span className="menu__index">{section.index}</span>
                <span>{section.navLabel ?? section.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="menu__foot" ref={footRef}>
        {socials.map((social) => (
          <a
            className="t-label link"
            key={social.id}
            href={social.href}
            {...(social.external
              ? { target: "_blank", rel: "noreferrer noopener" }
              : {})}
          >
            {social.label}
          </a>
        ))}
        <span className="t-label">{personal.location}</span>
      </div>
    </div>
  );
}
