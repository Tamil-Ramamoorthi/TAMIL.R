import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, motionEnabled } from "../../animations/gsapSetup";
import { refreshScrollTriggers } from "../../animations/scroll";
import { readyScreenshots, type Project } from "../../data";
import { ActionLink } from "../common/ActionLink";
import { Icon } from "../common/Icon";
import { ScreenshotCarousel } from "./ScreenshotCarousel";

/**
 * PROJECT LEDGER ROW
 * ==================
 * An editorial ledger entry, not a card: category label, oversized title,
 * descriptor and stack metadata on one numbered line, expanding into detail.
 *
 * The detail panel stays in the DOM so it is crawlable and searchable, and is
 * collapsed plus `inert` when closed — GSAP animates the height, nothing is
 * mounted or unmounted.
 *
 * MEDIA
 * -----
 * The media column renders only from `readyScreenshots()`. A declared slot
 * with no file yet contributes nothing: no empty frame, no broken image, and
 * no stand-in that could be mistaken for a real screen. The moment a
 * screenshot is dropped in and its `ready` flag flips, the column appears and
 * the layout switches to two columns on its own.
 *
 * LINKS
 * -----
 * Live demo is a disabled control on every project because none is deployed.
 * `ActionLink` handles that from a null href — no invented URLs.
 */
export interface ProjectRowProps {
  project: Project;
  open: boolean;
  onToggle: () => void;
}

export function ProjectRow({ project, open, onToggle }: ProjectRowProps) {
  const detailRef = useRef<HTMLDivElement>(null);
  const panelId = `project-detail-${project.id}`;
  const shots = readyScreenshots(project);
  const hasMedia = shots.length > 0;

  useGSAP(
    () => {
      const detail = detailRef.current;
      if (!detail) return;

      if (!motionEnabled()) {
        gsap.set(detail, { height: open ? "auto" : 0 });
        return;
      }

      gsap.to(detail, {
        height: open ? "auto" : 0,
        duration: 0.6,
        ease: "power3.inOut",
        onComplete: refreshScrollTriggers,
      });
    },
    { dependencies: [open] },
  );

  return (
    // `id` is the deep-link target the Experience section points at, so a
    // "related project" reference lands on the actual ledger row.
    <article
      className="project u-reveal"
      id={`project-${project.id}`}
      data-open={open ? "true" : "false"}
    >
      <span className="project__edge" aria-hidden="true" />

      {/*
        APG disclosure pattern: the heading carries the button, not the other
        way round, so the project still appears in the document outline while
        the whole row stays one control. `aria-label` keeps the accessible name
        short — the visible row also carries the category and the stack, which
        would otherwise all be read as the heading text.
      */}
      <h3 className="project__heading">
        <button
          className="project-row"
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={`${project.title} — ${project.subtitle}`}
          data-cursor="view"
          data-cursor-label={open ? "Close" : "Open"}
        >
          <span className="project-row__num">{project.index}</span>

          <span className="project-row__body">
            <span className="project-row__category">{project.category}</span>

            <span className="project-row__title">{project.title}</span>

            <span className="project-row__sub">{project.subtitle}</span>

            <span className="project-row__tags">
              {project.technologies.slice(0, 5).map((tech) => (
                <span className="project-row__tag" key={tech}>
                  {tech}
                </span>
              ))}
              {project.technologies.length > 5 ? (
                <span className="project-row__tag project-row__tag--more">
                  +{project.technologies.length - 5}
                </span>
              ) : null}
            </span>
          </span>

          <span className="project-row__aside">
            {project.status ? (
              <span className="status" data-status={project.status}>
                <span className="status__dot" aria-hidden="true" />
                {project.status.replace("-", " ")}
              </span>
            ) : null}
            <span className="project-row__cue" aria-hidden="true">
              {open ? "Close" : "Detail"}
            </span>
            <Icon name="chevron-right" className="project-row__chev" />
          </span>
        </button>
      </h3>

      <div
        className="project-detail"
        id={panelId}
        ref={detailRef}
        {...(open ? {} : { inert: true })}
      >
        <div
          className="project-detail__inner"
          data-media={hasMedia ? "true" : "false"}
        >
          <div className="project-detail__main">
            {project.description ? (
              <div className="project-detail__block">
                <h4 className="t-label">Overview</h4>
                <p className="t-body-l project-detail__lede">
                  {project.description}
                </p>
              </div>
            ) : null}

            {project.problem ? (
              <div className="project-detail__block">
                <h4 className="t-label">Problem</h4>
                <p className="t-body">{project.problem}</p>
              </div>
            ) : null}

            {project.solution ? (
              <div className="project-detail__block">
                <h4 className="t-label">Solution</h4>
                <p className="t-body">{project.solution}</p>
              </div>
            ) : null}

            {project.features.length > 0 ? (
              <div className="project-detail__block">
                <h4 className="t-label">Selected features</h4>
                <ul className="project-detail__features">
                  {project.features.map((feature) => (
                    <li className="project-detail__feature" key={feature}>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {project.metrics.length > 0 ? (
              <div className="project-detail__block">
                <h4 className="t-label">Results reported by the project</h4>
                <dl className="project-detail__metrics">
                  {project.metrics.map((metric) => (
                    <div className="project-detail__metric" key={metric.label}>
                      <dt>{metric.label}</dt>
                      <dd className="t-num">{metric.value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="project-detail__footnote">
                  As stated in the project README, measured by its author on
                  their own train/test split.
                </p>
              </div>
            ) : null}

            <div className="project-detail__block">
              <h4 className="t-label">Technologies</h4>
              <ul className="stack__items">
                {project.technologies.map((tech) => (
                  <li className="stack__item" key={tech}>
                    <span className="stack__item-name">{tech}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="project-detail__links">
              <ActionLink
                href={project.github}
                label="View repository"
                icon="github"
                size="sm"
                external
                cursor="hover"
                cursorLabel="GitHub"
                pendingHint="Repository URL not supplied yet"
              />
              <ActionLink
                href={project.liveDemo}
                label="Live demo"
                icon="arrow-up-right"
                size="sm"
                external
                pendingHint="Not deployed — no live demo URL"
              />
            </div>
          </div>

          {hasMedia ? (
            <div className="project-detail__media">
              <ScreenshotCarousel shots={shots} label={project.title} />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
