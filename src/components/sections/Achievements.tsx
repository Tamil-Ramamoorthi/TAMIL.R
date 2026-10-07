import {
  populatedAchievementGroups,
  readyCertificate,
  research,
  type AchievementEntry,
  type AchievementGroup,
  type ResearchEntry,
} from "../../data";
import { isReady, resolveAsset } from "../../config/assets";
import { ActionLink } from "../common/ActionLink";
import { AssetImage } from "../common/AssetImage";
import { CertificateViewer } from "../common/CertificateViewer";
import { Icon } from "../common/Icon";
import { SectionShell } from "../common/SectionShell";

/**
 * ACHIEVEMENTS, RESEARCH & PROFESSIONAL DEVELOPMENT
 * =================================================
 * A curated section, not an exhaustive one. `populatedAchievementGroups`
 * yields only entries flagged `active` in src/data/achievements.ts, and only
 * the groups that still hold one — so an entry whose certificate has not been
 * supplied is fully built but simply does not appear. Nothing renders as an
 * empty or broken row.
 *
 * ORDER
 * -----
 * The academic award, then the research, then everything else. The research
 * card is spliced in after the achievements group rather than stacked above
 * the lot, so the section reads 01 Achievement → 02 Research →
 * 03 Professional Development.
 *
 * Research is NOT a row in those ledgers. A conference paper is not a
 * certificate, so it gets its own editorial card with the strongest type in
 * the section.
 *
 * PROOF LINKS
 * -----------
 * Rendered as CTA labels through `ActionLink`, never as raw URLs, and always
 * `target="_blank"` with `rel="noreferrer noopener"`. A proof link appears
 * only when a URL was actually supplied.
 */
/*
  Derived once at module scope, not per render: the achievements data is a
  frozen module constant, so recomputing this split on every render would be
  work that can never produce a different answer.
*/
const academicGroups = populatedAchievementGroups.filter(
  (group) => group.id === "achievements",
);
const remainingGroups = populatedAchievementGroups.filter(
  (group) => group.id !== "achievements",
);

export function Achievements() {
  return (
    <SectionShell
      id="achievements"
      ghost="Proof"
      lede={
        <p>
          Academic recognition, published research and completed programmes —
          a selected record rather than a certificate wall.
        </p>
      }
    >
      <div className="awards">
        {academicGroups.map((group) => (
          <GroupLedger group={group} key={group.id} />
        ))}

        {research.map((paper) => (
          <div className="research" key={paper.id}>
            <ResearchCard paper={paper} />
          </div>
        ))}

        {remainingGroups.map((group) => (
          <GroupLedger group={group} key={group.id} />
        ))}
      </div>
    </SectionShell>
  );
}

/** One titled ledger: group header, then its numbered rows. */
function GroupLedger({ group }: { group: AchievementGroup }) {
  return (
    <section className="awards__group">
      <header className="awards__group-head u-reveal">
        <h3 className="awards__group-label">{group.label}</h3>
        <p className="awards__group-caption">{group.caption}</p>
        <span className="awards__group-count t-num">
          {String(group.items.length).padStart(2, "0")}
        </span>
      </header>

      <div className="awards__ledger">
        {group.items.map((item, position) => (
          <AchievementRow
            key={item.id}
            item={item}
            index={String(position + 1).padStart(2, "0")}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * RESEARCH CARD
 * The media column holds the conference certificate, and — once supplied — a
 * render of the paper's own first page. No designed cover, no fabricated
 * journal front matter.
 *
 * "Read paper" is an `ActionLink` fed the resolved PDF URL, so it renders as a
 * disabled control while the file is missing rather than a dead link.
 */
function ResearchCard({ paper }: { paper: ResearchEntry }) {
  const pdf = resolveAsset(paper.paper);
  const hasCover = isReady(paper.cover);
  const hasCertificate = isReady(paper.certificate ?? undefined);
  const hasMedia = hasCover || hasCertificate;

  return (
    <article className="research__item u-reveal">
      <span className="research__edge" aria-hidden="true" />

      <header className="research__head">
        <span className="research__kind">Research / Publication</span>
        <span className="research__index t-num">{paper.index}</span>
      </header>

      <div className="research__grid" data-media={hasMedia ? "true" : "false"}>
        <div className="research__body">
          <h3 className="research__title">{paper.title}</h3>

          {paper.subtitle ? (
            <p className="research__subtitle">{paper.subtitle}</p>
          ) : null}

          <div className="research__byline">
            <span className="research__author">{paper.author}</span>
            <span className="research__institution">{paper.institution}</span>
          </div>

          <p className="research__focus">{paper.description}</p>

          <ul className="research__topics">
            {paper.topics.map((topic) => (
              <li className="research__topic" key={topic}>
                {topic}
              </li>
            ))}
          </ul>

          <dl className="research__specs">
            {paper.venue ? (
              <div className="research__spec">
                <dt className="t-label">Conference</dt>
                <dd>
                  {paper.venue}
                  {paper.date ? ` · ${paper.date}` : null}
                  {paper.organizer ? (
                    <span className="research__organizer">
                      Organised by {paper.organizer}
                    </span>
                  ) : null}
                </dd>
              </div>
            ) : null}

            <div className="research__spec">
              <dt className="t-label">Domain</dt>
              <dd>{paper.domain}</dd>
            </div>

            <div className="research__spec">
              <dt className="t-label">Methods</dt>
              <dd>{paper.methods.join(" · ")}</dd>
            </div>

            {/*
              "Data analysed", not "indexed in". These are the databases the
              study draws from — relabelling this would turn a method into an
              indexing claim.
            */}
            <div className="research__spec">
              <dt className="t-label">Data analysed</dt>
              <dd>{paper.sources.join(" · ")}</dd>
            </div>
          </dl>

          <div className="research__actions">
            <ActionLink
              href={pdf}
              label="Read paper"
              icon="resume"
              variant="primary"
              size="sm"
              external
              cursor="hover"
              cursorLabel="Paper"
              pendingHint="Paper PDF not supplied yet"
            />

            {paper.proof.map((link) => (
              <ActionLink
                key={link.id}
                href={link.href}
                label={link.label}
                icon="linkedin"
                size="sm"
                external
                cursor="hover"
                cursorLabel="LinkedIn"
              />
            ))}
          </div>
        </div>

        {hasMedia ? (
          <div className="research__media">
            {/*
              A participation / presentation certificate, labelled as such. It
              is not the paper, and not evidence of publication or indexing.
            */}
            <CertificateViewer asset={paper.certificate} title={paper.title} />

            {hasCover ? (
              <figure className="research__preview">
                <AssetImage asset={paper.cover} ratio="portrait" />
                <figcaption className="research__preview-caption">
                  First page
                </figcaption>
              </figure>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

/** One ledger row. Every field renders only when it was actually supplied. */
function AchievementRow({
  item,
  index,
}: {
  item: AchievementEntry;
  index: string;
}) {
  const certificate = readyCertificate(item);
  const hasMedia = Boolean(certificate || item.supporting);

  return (
    <article
      className="awards__item u-reveal"
      data-featured={item.featured ? "true" : "false"}
    >
      <span className="awards__edge" aria-hidden="true" />

      <div
        className="awards__grid"
        data-media={hasMedia ? "true" : "false"}
        data-figure={item.metric ? "true" : "false"}
      >
        <div className="awards__meta">
          <span className="awards__index t-num">{index}</span>
          <span className="awards__kind">{item.kindLabel}</span>
          {item.credential ? (
            <span className="awards__credential">{item.credential}</span>
          ) : null}
          {item.date ? (
            <span className="awards__date t-num">{item.date}</span>
          ) : null}
          {item.location ? (
            <span className="awards__date">{item.location}</span>
          ) : null}
        </div>

        <div className="awards__body">
          <h4 className="awards__title">{item.title}</h4>

          {item.organization ? (
            <p className="awards__org">{item.organization}</p>
          ) : null}

          {item.detail ? <p className="awards__detail">{item.detail}</p> : null}

          {item.description ? (
            <p className="awards__desc">{item.description}</p>
          ) : null}

          {item.skills.length > 0 ? (
            <ul className="stack__items awards__skills">
              {item.skills.map((skill) => (
                <li className="stack__item" key={skill}>
                  <span className="stack__item-name">{skill}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {item.note ? <p className="awards__note">{item.note}</p> : null}

          {item.related.length > 0 ? (
            <ul className="awards__related-list">
              {item.related.map((ref) => (
                <li key={ref.href}>
                  <a className="awards__related" href={ref.href}>
                    <span>{ref.label}</span>
                    <Icon name="arrow-right" className="awards__related-icon" />
                  </a>
                  {ref.description ? (
                    <p className="awards__related-desc">{ref.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}

          {item.proof.length > 0 ? (
            <div className="awards__actions">
              {item.proof.map((link) => (
                <ActionLink
                  key={link.id}
                  href={link.href}
                  label={link.label}
                  icon="linkedin"
                  size="sm"
                  external
                  cursor="hover"
                  cursorLabel="LinkedIn"
                />
              ))}
            </div>
          ) : null}
        </div>

        {item.metric ? (
          <div className="awards__figure">
            {item.metricLabel ? (
              <span className="t-label">{item.metricLabel}</span>
            ) : null}
            <span className="awards__metric t-num">{item.metric}</span>
          </div>
        ) : null}

        {hasMedia ? (
          <div className="awards__media">
            <CertificateViewer asset={certificate} title={item.title} />
            {/*
              A supporting visual, e.g. the award presentation photograph.
              Same viewer, but never presented as a second certificate.
            */}
            <CertificateViewer
              asset={item.supporting}
              title={item.title}
              actionLabel="View photograph"
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
