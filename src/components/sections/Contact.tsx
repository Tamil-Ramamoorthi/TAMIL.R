import { assets, resolveAsset } from "../../config/assets";
import { getSection } from "../../config/site";
import { mailtoHref, personal, socials } from "../../data";
import { ActionLink } from "../common/ActionLink";
import { GhostWord } from "../common/GhostWord";

/**
 * CONTACT
 * =======
 * The final section: a full-scale statement, one primary CTA, and the verified
 * channels laid out as an editorial ledger. Cinematic in scale, restrained in
 * colour — no form, no cards.
 *
 * Every value comes from `src/data/personal.ts`; nothing is written into this
 * component, so the address and the URLs are each declared exactly once and
 * the footer reads the same source.
 *
 * The resume PDF is supplied, so that button is live. It keeps its pending
 * fallback: remove the file and the control goes back to a disabled chip
 * rather than a 404.
 *
 * Reveal rides the shared `.u-reveal` / `.u-mask-lines` batch from
 * src/animations/scroll.ts — no section-specific animation code.
 */
export function Contact() {
  const statement = personal.closingStatement;
  const words = statement.split(" ");
  const lead = words.slice(0, -1).join(" ");
  const last = words.at(-1) ?? "";

  const resumeHref = resolveAsset(assets.resume);
  const meta = getSection("contact");

  return (
    <section
      className="section contact"
      id="contact"
      aria-labelledby="contact-heading"
    >
      <GhostWord word="Connect" variant="fill" />

      <div className="container">
        <header className="section-head">
          <div className="section-head__meta u-reveal-fade">
            <span className="section-head__index">{meta.index}</span>
            <span className="section-head__rule" data-draw-rule />
          </div>

          <h2 id="contact-heading" className="contact__statement u-mask-lines">
            <span>
              {lead} <em>{last}</em>
            </span>
          </h2>

          <p className="contact__intro t-body u-reveal">
            {personal.contactIntro}
          </p>

          <div className="contact__cta u-reveal">
            <ActionLink
              href={mailtoHref}
              label="Let’s connect"
              icon="arrow-up-right"
              variant="primary"
              cursor="hover"
              cursorLabel="Email"
            />
            <span className="contact__cta-note">
              Email is the fastest way to reach me.
            </span>
          </div>
        </header>

        <div className="contact__grid u-reveal">
          {socials.map((social) => (
            <div className="contact__cell" key={social.id}>
              <span className="t-label">{social.label}</span>
              <a
                className="contact__value link"
                href={social.href}
                data-cursor="hover"
                {...(social.external
                  ? {
                      target: "_blank",
                      rel: "noreferrer noopener",
                      "aria-label": `${social.label} — ${social.display} (opens in a new tab)`,
                    }
                  : { "aria-label": `${social.label} — ${social.display}` })}
              >
                {social.display}
              </a>
            </div>
          ))}

          <div className="contact__cell">
            <span className="t-label">Based in</span>
            <span className="contact__value">{personal.location}</span>
          </div>

          <div className="contact__cell">
            <span className="t-label">Resume</span>
            <ActionLink
              href={resumeHref}
              label={resumeHref ? "Open PDF" : "Resume pending"}
              icon="resume"
              size="sm"
              variant="ghost"
              external
              pendingHint="Resume PDF not supplied yet"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
