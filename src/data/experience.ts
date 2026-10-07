/**
 * EXPERIENCE
 * ==========
 * Two machine learning internships. Role, company, type, dates, location,
 * responsibilities and focus areas are all verified; nothing here is inferred
 * from what an ML internship usually involves.
 *
 * MEDIA
 * -----
 * Each entry declares the certificate slots that genuinely exist, all with
 * `ready: false` because no scan is in the repository yet. Not-ready slots
 * render nothing at all — no frame, no stand-in. A fabricated certificate
 * would be a forgery, so this is the one asset class that gets no placeholder
 * scaffolding anywhere in the codebase.
 *
 * To supply one: drop the file at the declared path under
 * `public/images/experience/` and pass `true` as the last argument to
 * `experienceAsset()`. No component changes.
 *
 * The extra CodeAlpha image is captioned "Project image" and nothing more —
 * its subject was not stated, and guessing would be inventing a claim.
 *
 * `relatedProjects` holds project ids, resolved through `getProject()` at
 * render time so a title can never drift out of sync with src/data/projects.ts.
 */

import { experienceAsset, type ExperienceAsset } from "../config/assets";

export interface ExperienceEntry {
  readonly id: string;
  /** Zero-padded ledger number, e.g. "01". */
  readonly index: string;
  readonly role: string;
  readonly company: string;
  /** Typographic company marker, used because no logo asset exists. */
  readonly initials: string;
  /** Engagement type, e.g. "Internship". */
  readonly type: string;
  readonly start: string;
  /** `null` means the role is current. */
  readonly end: string | null;
  readonly location: string;
  readonly mode: "On-site" | "Remote" | "Hybrid";
  /** Two-sentence portfolio summary of the verified description. */
  readonly summary: string;
  /** Verified responsibilities. */
  readonly points: readonly string[];
  /** Compact skill metadata — the "selected areas" tags. */
  readonly focus: readonly string[];
  /** Project ids from src/data/projects.ts produced during this role. */
  readonly relatedProjects: readonly string[];
  /** Certificates and role imagery. Not-ready slots are hidden. */
  readonly media: readonly ExperienceAsset[];
}

export const experience: readonly ExperienceEntry[] = [
  {
    id: "marcellotech",
    index: "01",
    role: "Machine Learning Intern",
    company: "MarcelloTech",
    initials: "MT",
    type: "Internship",
    start: "June 2026",
    end: null,
    location: "Tiruchirappalli, Tamil Nadu, India",
    mode: "On-site",
    summary:
      "A one-month internship in artificial intelligence and machine learning, working hands-on with regression and classification algorithms. The work ran the full length of the workflow on real-world datasets — preprocessing, training, evaluation — in Python and Scikit-learn.",
    points: [
      "Worked hands-on with regression and classification algorithms",
      "Performed data preprocessing on real-world datasets",
      "Trained and evaluated models using Python and Scikit-learn",
      "Built up an end-to-end understanding of the ML workflow",
    ],
    focus: [
      "Machine Learning",
      "Data Preprocessing",
      "Regression",
      "Classification",
      "Python",
      "Scikit-learn",
    ],
    relatedProjects: [],
    media: [
      experienceAsset(
        "marcello-tech-certificate.jpg",
        "Internship certificate",
        "MarcelloTech machine learning internship completion certificate",
      ),
    ],
  },
  {
    id: "codealpha",
    index: "02",
    role: "Machine Learning Intern",
    company: "CodeAlpha",
    initials: "CA",
    type: "Internship",
    start: "June 2026",
    end: null,
    location: "Remote",
    mode: "Remote",
    summary:
      "A machine learning internship spent building real-world AI solutions rather than exercises. Two shipped: an AI credit-score prediction model, and CareGPT, an AI-powered healthcare screening project — covering preprocessing, model development and deploying the applications.",
    points: [
      "Developed an AI credit score prediction model",
      "Worked on CareGPT, an AI-powered healthcare screening project",
      "Strengthened data preprocessing skills across both builds",
      "Worked on model development and deploying ML applications",
    ],
    focus: [
      "Machine Learning",
      "Deep Learning",
      "Data Preprocessing",
      "Model Development",
      "AI Applications",
    ],
    relatedProjects: ["ai-credit-scoring", "caregpt-ai"],
    media: [
      experienceAsset(
        "codealpha-certificate.jpg",
        "Internship certificate",
        "CodeAlpha machine learning internship completion certificate",
      ),
      experienceAsset(
        "codealpha-project.jpg",
        "Project image",
        "Image from the CodeAlpha machine learning internship",
      ),
    ],
  },
];

/** Formats a period as it appears in the ledger. */
export const formatPeriod = (entry: ExperienceEntry): string =>
  `${entry.start} — ${entry.end ?? "Present"}`;

/**
 * Media whose file has actually been supplied. The media column renders only
 * from this, so a declared-but-empty certificate slot shows nothing.
 */
export const readyExperienceMedia = (
  entry: ExperienceEntry,
): readonly ExperienceAsset[] => entry.media.filter((item) => item.ready);
