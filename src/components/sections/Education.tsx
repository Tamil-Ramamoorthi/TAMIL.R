import {
  educationTitle,
  formatEducationPeriod,
  renderableEducation,
} from "../../data";
import { SectionShell } from "../common/SectionShell";

/**
 * EDUCATION
 * =========
 * A numbered academic ledger in the same language as Experience and Projects:
 * mono metadata column, oversized award type, accent rule down the left edge
 * on hover. Verified details only.
 *
 * The CGPA gets its own bordered figure on the right — emphasis without a
 * chart, a bar or a percentage. Its value carries the denominator ("8.52 / 10")
 * so it can never be misread as a percentage.
 *
 * Anna University renders as the awarding university on the B.Tech entry, not
 * as a second record — see the note in src/data/education.ts.
 *
 * Entries come from `renderableEducation`, which withholds any entry whose
 * period is not yet verified rather than publishing a half-empty row.
 */
export function Education() {
  return (
    <SectionShell
      id="education"
      ghost="Data"
      lede={
        <p>
          Undergraduate study in artificial intelligence and data science,
          currently in progress.
        </p>
      }
    >
      <div className="edu">
        {renderableEducation.map((entry) => (
          <article className="edu__entry u-reveal" key={entry.id}>
            <span className="edu__edge" aria-hidden="true" />

            <div className="edu__grid">
              {/* Mono metadata column: ordinal, stage, period, place. */}
              <div className="edu__meta">
                <span className="edu__index t-num">{entry.index}</span>
                <span className="edu__dates t-num">
                  {formatEducationPeriod(entry)}
                </span>
                <span className="edu__place">
                  {entry.expected ? "In progress" : "Completed"}
                </span>
                {entry.location ? (
                  <span className="edu__place">{entry.location}</span>
                ) : null}
              </div>

              <div className="edu__body">
                <span className="edu__stage">{entry.stage}</span>

                <h3 className="edu__degree">{educationTitle(entry)}</h3>

                <p className="edu__org">
                  <span className="edu__mark" aria-hidden="true">
                    {entry.initials}
                  </span>
                  <span className="edu__institution">{entry.institution}</span>
                </p>

                {entry.university ? (
                  <p className="edu__university">
                    Awarded by {entry.university}
                  </p>
                ) : null}

                {entry.details.length > 0 ? (
                  <ul className="edu__details">
                    {entry.details.map((detail) => (
                      <li className="edu__detail" key={detail}>
                        {detail}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {entry.score ? (
                <div className="edu__score">
                  <span className="t-label">{entry.score.label}</span>
                  <span className="edu__score-value t-num">
                    {entry.score.value}
                  </span>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
