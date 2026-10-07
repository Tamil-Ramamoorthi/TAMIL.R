/**
 * EDUCATION
 * ==========
 * Verified details only.
 *
 * ANNA UNIVERSITY IS NOT A SEPARATE ENTRY
 * ---------------------------------------
 * It is the awarding university for the PGP College degree, so it lives on
 * that entry as `university`. Listing it again as its own record would read as
 * two bachelor's degrees, which would be false.
 *
 * ACADEMIC AWARDS ARE NOT REPEATED HERE
 * -------------------------------------
 * "Overall Topper — 3 Year AI & DS" is an entry in src/data/achievements.ts
 * and stays there. The CGPA appears in both places because it is the degree's
 * own figure, not because the award is duplicated.
 *
 * HIGHER SECONDARY IS DECLARED BUT NOT YET RENDERABLE
 * ---------------------------------------------------
 * The school name is known. Its qualification, stream, period and marks are
 * NOT in the resume data anywhere in this repository, and inventing a date
 * range or a percentage is not an option. So the entry is declared with nulls
 * and `renderableEducation` filters it out until a period is supplied — the
 * same declared-slot-hidden-until-ready pattern the asset manifest uses.
 *
 * To switch it on: fill `start`, `end` and `qualification` from the resume.
 * Nothing else has to change.
 */

export interface EducationScore {
  readonly label: string;
  /** Written with its denominator so a CGPA can never read as a percentage. */
  readonly value: string;
}

export interface EducationEntry {
  readonly id: string;
  /** Zero-padded ledger number, e.g. "01". */
  readonly index: string;
  /** Stage label, e.g. "Undergraduate". */
  readonly stage: string;
  /** Award, e.g. "B.Tech". Null where no formal award is recorded. */
  readonly degree: string | null;
  /** Specialisation. Null for pre-university study. */
  readonly field: string | null;
  /** Shown when there is no degree/field — e.g. "Higher Secondary". */
  readonly qualification: string | null;
  readonly institution: string;
  /** Typographic institution marker; no logo asset exists for either. */
  readonly initials: string;
  /** Awarding university. Null where the institution awards directly. */
  readonly university: string | null;
  readonly start: string | null;
  readonly end: string | null;
  /** `true` while the programme is still in progress. */
  readonly expected: boolean;
  readonly location: string | null;
  readonly score: EducationScore | null;
  /** Verified academic detail. Empty unless the resume states it. */
  readonly details: readonly string[];
}

export const education: readonly EducationEntry[] = [
  {
    id: "btech-aids",
    index: "01",
    stage: "Undergraduate",
    degree: "B.Tech",
    field: "Artificial Intelligence & Data Science",
    qualification: null,
    institution: "PGP College of Engineering and Technology",
    initials: "PGP",
    university: "Anna University, Chennai",
    start: "September 2024",
    end: "June 2028",
    expected: true,
    location: "Namakkal, Tamil Nadu, India",
    score: { label: "Current CGPA", value: "8.52 / 10" },
    details: [],
  },
  {
    id: "higher-secondary",
    index: "02",
    stage: "Higher Secondary",
    degree: null,
    field: null,
    // NOT SUPPLIED — the resume data in this repo does not state the
    // qualification, stream, period or marks. Left null rather than guessed;
    // the entry stays hidden until these are filled in.
    qualification: null,
    institution: "Chettinad Rani Meyyammai Higher Secondary School",
    initials: "CRM",
    university: null,
    start: null,
    end: null,
    expected: false,
    location: null,
    score: null,
    details: [],
  },
];

/**
 * Entries with enough verified detail to publish. An entry with no period is
 * a declared slot, not a record — it is withheld rather than rendered as a
 * half-empty row or padded out with invented dates.
 */
export const renderableEducation: readonly EducationEntry[] = education.filter(
  (entry) => Boolean(entry.start && entry.end),
);

/** The headline for an entry: the award if there is one, else the stage. */
export const educationTitle = (entry: EducationEntry): string => {
  if (entry.degree && entry.field) return `${entry.degree} — ${entry.field}`;
  if (entry.degree) return entry.degree;
  return entry.qualification ?? entry.stage;
};

export const formatEducationPeriod = (entry: EducationEntry): string => {
  if (!entry.start || !entry.end) return "";
  return `${entry.start} — ${entry.end}`;
};
