import type { ReactNode } from "react";
import { getSection, type SectionId } from "../../config/site";
import { GhostWord } from "./GhostWord";

/**
 * The structural wrapper every section uses: anchor id, container, numbered
 * header and an optional oversized background word.
 *
 * Section numbering and titles come from `src/config/site.ts`, so the ledger
 * stays consistent and reordering sections is a one-line change there.
 */
export interface SectionShellProps {
  id: SectionId;
  /** Overrides the title from the section registry. */
  title?: string;
  /** Supporting line beside the heading. */
  lede?: ReactNode;
  /** Background word, e.g. "DATA". Omit for no ghost type. */
  ghost?: string;
  ghostVariant?: "stroke" | "fill";
  children: ReactNode;
  className?: string;
}

export function SectionShell({
  id,
  title,
  lede,
  ghost,
  ghostVariant = "stroke",
  children,
  className,
}: SectionShellProps) {
  const meta = getSection(id);
  const heading = title ?? meta.title;
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      className={`section ${className ?? ""}`}
      aria-labelledby={headingId}
    >
      {ghost ? <GhostWord word={ghost} variant={ghostVariant} /> : null}

      <div className="container">
        <header className="section-head">
          <div className="section-head__meta u-reveal-fade">
            <span className="section-head__index">{meta.index}</span>
            <span className="section-head__rule" data-draw-rule />
          </div>

          <h2 id={headingId} className="t-h2 section-head__title u-mask-lines">
            <span>{heading}</span>
          </h2>

          {lede ? (
            <div className="section-head__lede t-body u-reveal">{lede}</div>
          ) : null}
        </header>

        {children}
      </div>
    </section>
  );
}
