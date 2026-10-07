import {
  softSkills,
  technicalSkillCount,
  technicalSkillGroups,
  verifySkillUniqueness,
} from "../../data";
import { Icon } from "../common/Icon";
import { SectionShell } from "../common/SectionShell";

/**
 * TECH STACK
 * ==========
 * A numbered editorial ledger, not a badge wall and not a row of proficiency
 * bars — there are no percentages here because there is no honest way to
 * author them.
 *
 * Each row is one category: ordinal and label on the left, the technologies
 * themselves on the right. One icon per category rather than one per
 * technology, which avoids attaching a generic glyph to a specific tool it
 * does not represent; the technology names carry themselves typographically.
 *
 * The categories, their order, their captions and their icons all come from
 * `src/data/skills.ts`. Nothing about the stack is authored in this file — a
 * new category is a data edit, and the ordinals renumber themselves.
 *
 * Soft skills render in a footnote below the ledger, never inside the grid.
 *
 * Reveal comes from the shared `.u-reveal` batch in src/animations/scroll.ts —
 * no section-specific animation code. Hover states are CSS transitions on the
 * existing accent tokens.
 */
export function TechStack() {
  // Guards the one-technology-one-category rule; see src/data/skills.ts.
  if (import.meta.env.DEV) verifySkillUniqueness();

  return (
    <SectionShell
      id="tech-stack"
      ghost="Stack"
      lede={
        <p>
          What I use to build AI systems — {technicalSkillCount} verified
          technologies, grouped by the job they do rather than ranked by a
          number I made up.
        </p>
      }
    >
      <div className="stack">
        {technicalSkillGroups.map((group) => (
          <article className="stack__group u-reveal" key={group.id}>
            <span className="stack__edge" aria-hidden="true" />

            <div className="stack__meta">
              <span className="stack__index t-num">{group.index}</span>

              <div className="stack__titles">
                <h3 className="stack__label">
                  <Icon name={group.icon} className="stack__icon" />
                  <span>{group.label}</span>
                </h3>
                <p className="stack__caption">{group.caption}</p>
              </div>
            </div>

            <ul className="stack__items">
              {group.items.map((item) => (
                <li className="stack__item" key={item.name}>
                  <span className="stack__item-name">{item.name}</span>
                  {item.note ? (
                    <span className="stack__item-note">{item.note}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {softSkills.length > 0 ? (
        <footer className="stack__aside u-reveal">
          <span className="t-label">Alongside</span>
          <p className="stack__aside-list">
            {softSkills.map((skill) => skill.name).join(" · ")}
          </p>
        </footer>
      ) : null}
    </SectionShell>
  );
}
