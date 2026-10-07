import { getSocial, personal, socials } from "../../data";
import { Icon } from "./Icon";

/**
 * FOOTER
 * ======
 * The page footer, rendered OUTSIDE `<main>` — it is site-level, not part of
 * the document's main content, and that is also why it carries no `.u-reveal`:
 * the reveal batch is registered on the main scroll surface, and a footer that
 * animated in after the page ended would be motion for its own sake.
 *
 * One row on desktop, stacked on mobile. Every value reads from
 * `src/data/personal.ts`, the same source the Contact section uses, so the
 * address and URLs are never written twice.
 *
 * The year is computed, not hardcoded, so the notice cannot go stale.
 */

// Email first — it is the channel the contact section points at.
const ORDER = ["email", "linkedin", "github"] as const;

/*
  Ordered once at module scope: `socials` is a frozen module constant, so this
  can only ever produce the same list. Anything added to the data later still
  appears, without having to be named in ORDER.
*/
const footerLinks = [
  ...ORDER.map((id) => getSocial(id)).filter((link) => link !== undefined),
  ...socials.filter(
    (social) => !ORDER.includes(social.id as (typeof ORDER)[number]),
  ),
];

export function Footer() {
  // Not hoisted: a session open across New Year should not print last year.
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="container site-footer__inner">
        <div className="site-footer__identity">
          <span className="site-footer__name">{personal.name}</span>
          <span className="site-footer__role">{personal.title}</span>
        </div>

        <nav className="site-footer__links" aria-label="Contact links">
          {footerLinks.map((link) => (
            <a
              className="site-footer__link"
              key={link.id}
              href={link.href}
              data-cursor="hover"
              {...(link.external
                ? {
                    target: "_blank",
                    rel: "noreferrer noopener",
                    "aria-label": `${link.label} (opens in a new tab)`,
                  }
                : { "aria-label": link.label })}
            >
              <Icon name={link.icon} className="site-footer__icon" />
              <span>{link.label}</span>
            </a>
          ))}
        </nav>

        <p className="site-footer__copy">
          &copy; {year} {personal.name}
        </p>
      </div>
    </footer>
  );
}
