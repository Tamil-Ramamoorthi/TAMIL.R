import {
  experience,
  formatPeriod,
  getProject,
  readyExperienceMedia,
} from "../../data";
import { resolveAsset } from "../../config/assets";
import { AssetImage } from "../common/AssetImage";
import { Icon } from "../common/Icon";
import { SectionShell } from "../common/SectionShell";

/**
 * EXPERIENCE
 * ==========
 * A numbered editorial ledger, built to the same language as Projects and
 * Tech Stack: mono metadata column, oversized role type, accent rule that
 * grows down the left edge on hover. Not a timeline of cards.
 *
 * COMPANY IDENTITY
 * ----------------
 * No logo asset exists for either company, so the marker is typographic
 * initials from the data. Nothing is downloaded and no mark is fabricated.
 *
 * MEDIA
 * -----
 * The certificate column renders only from `readyExperienceMedia()`. No scan
 * has been supplied yet, so today every entry renders without a media column
 * and the layout stays single-column — see `data-media`. Supplying a file
 * switches it on with no component change.
 *
 * RELATED PROJECTS
 * ----------------
 * Resolved through `getProject()` and linked to `#project-<id>`, the anchor on
 * the real Projects ledger row. Titles come from the projects data, so they
 * cannot drift; an unresolved id simply renders nothing.
 */
export function Experience() {
  return (
    <SectionShell
      id="experience"
      ghost="Work"
      lede={
        <p>
          Two machine learning internships, both current — applied work on real
          datasets and shipped AI applications.
        </p>
      }
    >
      <div className="exp">
        {experience.map((entry) => {
          const media = readyExperienceMedia(entry);
          const related = entry.relatedProjects
            .map((id) => getProject(id))
            .filter((project) => project !== undefined);

          return (
            <article className="exp__entry u-reveal" key={entry.id}>
              <span className="exp__edge" aria-hidden="true" />

              <div
                className="exp__grid"
                data-media={media.length > 0 ? "true" : "false"}
              >
                {/* Mono metadata column: ordinal, period, place, mode. */}
                <div className="exp__meta">
                  <span className="exp__index t-num">{entry.index}</span>
                  <span className="exp__dates t-num">
                    {formatPeriod(entry)}
                  </span>
                  <span className="exp__place">{entry.location}</span>
                  <span className="exp__place">{entry.mode}</span>
                </div>

                <div className="exp__body">
                  <h3 className="exp__role">{entry.role}</h3>

                  <p className="exp__org">
                    <span className="exp__mark" aria-hidden="true">
                      {entry.initials}
                    </span>
                    <span className="exp__company">{entry.company}</span>
                    <span className="exp__type">{entry.type}</span>
                  </p>

                  <p className="exp__summary">{entry.summary}</p>

                  {entry.points.length > 0 ? (
                    <ul className="exp__points">
                      {entry.points.map((point) => (
                        <li className="exp__point" key={point}>
                          {point}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {entry.focus.length > 0 ? (
                    <div className="exp__block">
                      <h4 className="t-label">Selected areas</h4>
                      <ul className="stack__items">
                        {entry.focus.map((area) => (
                          <li className="stack__item" key={area}>
                            <span className="stack__item-name">{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {related.length > 0 ? (
                    <div className="exp__block">
                      <h4 className="t-label">Selected work</h4>
                      <ul className="exp__related">
                        {related.map((project) => (
                          <li key={project.id}>
                            <a
                              className="exp__related-link"
                              href={`#project-${project.id}`}
                            >
                              <span>{project.title}</span>
                              <Icon
                                name="arrow-right"
                                className="exp__related-icon"
                              />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                {media.length > 0 ? (
                  <div className="exp__media">
                    {media.map((item) => {
                      const href = resolveAsset(item);

                      return (
                        <figure className="exp__cert" key={item.path}>
                          {/*
                            The frame links to the full-resolution file so a
                            certificate is actually readable. A plain anchor,
                            so it is keyboard-reachable with no JS.
                          */}
                          <a
                            className="exp__cert-frame"
                            href={href ?? undefined}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={`Open ${item.caption} for ${entry.company} at full size`}
                            data-cursor="view"
                            data-cursor-label="Open"
                          >
                            <AssetImage asset={item} ratio="video" />
                          </a>
                          <figcaption className="exp__cert-caption">
                            {entry.company} · {item.caption}
                          </figcaption>
                        </figure>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </SectionShell>
  );
}
