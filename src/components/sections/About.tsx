import { useGSAP } from "@gsap/react";
import { useMemo, useRef } from "react";
import { initWordHighlight } from "../../animations/scroll";
import {
  achievementGroups,
  education,
  experience,
  personal,
  projects,
  research,
} from "../../data";
import { SectionShell } from "../common/SectionShell";

/**
 * ABOUT
 * =====
 * Typography-led, full width. There is no portrait: rather than reserving a
 * column for an image that does not exist, the type takes the whole measure
 * and the section reads as a deliberate editorial statement.
 *
 * The composition runs in bands — statement, supporting columns, current
 * focus, a highlights row, then the facts ledger. The last band deliberately
 * echoes the Contact section's channel ledger, so the two ends of the page
 * share a device.
 *
 * NOTHING HERE IS WRITTEN INTO THE COMPONENT
 * ------------------------------------------
 * Every figure is derived from the section that owns it: the internship count
 * from `experience`, the project count from `projects`, the CGPA from
 * `education`, the award from `achievementGroups`, the paper from `research`.
 * Add a project and this section counts four, then five, on its own — the
 * numbers cannot drift out of step with the sections they summarise, because
 * they are the same data.
 *
 * The opening paragraph is split into words so the scroll-highlight effect can
 * brighten it as it passes the viewport. The split is purely visual: screen
 * readers get the sentence back from the visually-hidden copy.
 */
export function About() {
  const ledeRef = useRef<HTMLParagraphElement>(null);
  const degree = education[0];

  const [lede, ...rest] = personal.summary;

  const words = useMemo(
    () => (lede ?? "").split(" ").map((word, index) => ({ word, index })),
    [lede],
  );

  useGSAP(() => initWordHighlight(ledeRef.current), []);

  const topper = achievementGroups
    .flatMap((group) => group.items)
    .find((item) => item.id === "overall-topper");

  const paper = research[0];
  /* The stored venue is the conference's full name; the ledger only has room
     for its short form, which is the segment before the dash. */
  const shortVenue = paper?.venue?.split("—")[0]?.trim() ?? null;

  const highlights = [
    {
      label: "Experience",
      value: String(experience.length),
      meta: "Machine learning internships",
    },
    {
      label: "Projects",
      value: String(projects.length),
      meta: "AI / ML projects, built end to end",
    },
    {
      label: "Academic highlight",
      value: degree?.score?.value ?? "",
      meta:
        topper && degree?.field ? `${topper.title} — ${degree.field}` : null,
    },
    {
      label: "Research",
      value: paper?.title ?? "",
      meta: shortVenue ? `${shortVenue} International Conference` : null,
    },
  ].filter((item) => item.value);

  const facts = [
    { label: "Based in", value: personal.location },
    {
      label: "Studying",
      value: degree ? `${degree.degree} ${degree.field}` : "",
    },
    { label: "Institution", value: degree?.institution ?? "" },
    {
      label: "Languages",
      value: personal.languages
        .map((language) => `${language.name} (${language.level})`)
        .join(" · "),
    },
  ].filter((fact) => fact.value);

  return (
    <SectionShell
      id="about"
      ghost="About"
      lede={
        <p>
          AI &amp; Data Science undergraduate, building machine learning systems
          that run end to end.
        </p>
      }
    >
      <div className="about">
        <div className="about__opening">
          <p className="about__lede" ref={ledeRef}>
            {/* Readable sentence for assistive tech; the split spans below are
                decorative and exist only so each word can be lit on scroll. */}
            <span className="u-sr-only">{lede}</span>
            {words.map(({ word, index }) => (
              <span className="word" key={`${word}-${index}`} aria-hidden="true">
                {index === 0 ? word : ` ${word}`}
              </span>
            ))}
          </p>

          <p className="about__statement u-reveal">{personal.aboutStatement}</p>
        </div>

        {/* Two columns on wide viewports — one paragraph each, so the width is
            used without ever leaving a short orphan column. */}
        {rest.length > 0 ? (
          <div className="about__columns">
            {rest.map((paragraph) => (
              <p className="about__para u-reveal" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}

        <div className="about__focus u-reveal">
          <h3 className="t-label about__focus-label">Current focus</h3>
          <ul className="about__tags">
            {personal.currentFocus.map((item) => (
              <li className="about__tag" key={item}>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <dl className="about__highlights u-reveal">
          {highlights.map((item) => (
            <div
              className="about__highlight"
              key={item.label}
              /* A title, not a figure — set as prose rather than a numeral. */
              data-long={item.value.length > 12 ? "true" : "false"}
            >
              <dt className="t-label">{item.label}</dt>
              <dd className="about__highlight-value">{item.value}</dd>
              {item.meta ? (
                <p className="about__highlight-meta">{item.meta}</p>
              ) : null}
            </div>
          ))}
        </dl>

        <dl className="about__facts u-reveal">
          {facts.map((fact) => (
            <div className="about__fact" key={fact.label}>
              <dt className="t-label">{fact.label}</dt>
              <dd className="about__fact-value">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </SectionShell>
  );
}
