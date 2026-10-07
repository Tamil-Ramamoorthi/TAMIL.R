/**
 * TECHNICAL SKILLS
 * ================
 * The résumé and `src/data/projects.ts` are the sources of truth. Only
 * technologies one of them verifies appear here — nothing is added because it
 * is "commonly associated with AI work".
 *
 * WHAT THE EVIDENCE ACTUALLY SAYS
 * -------------------------------
 * The résumé's TECHNICAL SKILLS block reads: Python / Machine Learning, Deep
 * Learning, Data Preprocessing, AI Models, Mathematics for AI (basics) / Flask,
 * Scikit-learn, Pandas / Google Gemini API, Ollama (Llama 3), LiveKit / HTML,
 * CSS, JavaScript / Data Visualization / Communication, Problem-Solving.
 *
 * MySQL is declared by the portfolio owner directly, and is the sole entry in
 * the Database category.
 *
 * Two entries here come from the project ledger rather than that block, and
 * both are traceable:
 *   - NumPy        — declared by AI Credit Score Prediction (projects.ts).
 *   - Random Forest — the classifier in BOTH shipped ML applications, and named
 *                     in the résumé's professional summary.
 *
 * DELIBERATE ABSENCES
 * -------------------
 * PostgreSQL, Supabase, MongoDB, SciPy, Matplotlib, Seaborn, Plotly, React,
 * and the "Llama 3.2" point release are all plausible for this profile and all
 * absent: none of them appears in the résumé, in any project's
 * `technologies`, in the experience focus lists or anywhere else in
 * `src/data/`. The Database category holds MySQL alone for that reason — a
 * category padded with unverified members is not a category, it is a claim.
 *
 * Add the evidence first (a project that lists it, or a résumé line) and the
 * entry becomes a one-line addition here.
 *
 * THREE DELIBERATE STRUCTURAL DECISIONS
 * -------------------------------------
 *  1. `soft` is a category here but is NOT part of the technical stack. The
 *     Tech Stack grid renders `technicalSkillGroups`, which excludes it, so a
 *     soft skill can never end up sitting beside Flask in a technology grid.
 *  2. Category numbering is derived, not authored. `technicalSkillGroups`
 *     stamps 01…NN in array order, so reordering or adding a category is a
 *     one-line change and the ledger stays contiguous.
 *  3. Every technology sits in exactly ONE category — the one where it does
 *     its job. Scikit-learn is modelling, Pandas and NumPy are the data work
 *     underneath it, Flask is the application layer. Nothing is listed twice
 *     to make a category look fuller.
 *
 * `tools` is declared so it can be filled later; it carries no entries, and
 * empty groups are filtered out rather than rendered as a gap.
 */

import type { IconKey } from "./personal";

export type SkillCategoryId =
  | "programming"
  | "ai-ml"
  | "data"
  | "database"
  | "dataviz"
  | "genai"
  | "realtime"
  | "web"
  | "tools"
  | "soft";

export interface Skill {
  readonly name: string;
  /** Short qualifier shown beside the name, e.g. "basics". */
  readonly note?: string;
}

export interface SkillGroup {
  readonly id: SkillCategoryId;
  readonly label: string;
  /** One line explaining what this group covers. */
  readonly caption: string;
  readonly icon: IconKey;
  /** False for groups that must stay out of the technical technology grid. */
  readonly technical: boolean;
  readonly items: readonly Skill[];
}

/** A technical group with its position in the ledger stamped on. */
export interface NumberedSkillGroup extends SkillGroup {
  /** Zero-padded ordinal, e.g. "03". Derived from array order. */
  readonly index: string;
}

export const skillGroups: readonly SkillGroup[] = [
  {
    id: "programming",
    label: "Programming",
    caption: "The core language behind my AI and data work.",
    icon: "code",
    technical: true,
    items: [{ name: "Python" }],
  },
  {
    id: "ai-ml",
    label: "Machine Learning & AI",
    caption: "Building and evaluating practical machine learning systems.",
    icon: "brain",
    technical: true,
    items: [
      { name: "Machine Learning" },
      { name: "Deep Learning" },
      { name: "Scikit-learn" },
      // The classifier behind both shipped ML applications.
      { name: "Random Forest" },
      { name: "AI Models" },
      { name: "Mathematics for AI", note: "basics" },
    ],
  },
  {
    id: "data",
    label: "Data & Analytics",
    caption: "The preparation and numerical work a model depends on.",
    icon: "grid",
    technical: true,
    items: [
      { name: "Data Preprocessing" },
      { name: "Pandas" },
      { name: "NumPy" },
    ],
  },
  {
    id: "database",
    label: "Database",
    caption: "Storing and querying the structured data behind an application.",
    icon: "database",
    technical: true,
    items: [{ name: "MySQL" }],
  },
  {
    id: "dataviz",
    label: "Data Visualization",
    caption: "Communicating what a model actually found.",
    icon: "chart",
    technical: true,
    // One entry, and deliberately so: the résumé claims the capability, no
    // source in this repository names the library. Matplotlib and Seaborn go
    // in the moment a project declares them.
    items: [{ name: "Data Visualization" }],
  },
  {
    id: "genai",
    label: "Generative AI",
    caption: "Hosted and local LLMs used in shipped projects.",
    icon: "sparkles",
    technical: true,
    items: [
      { name: "Google Gemini API" },
      { name: "Ollama" },
      /* The model, qualified by its runtime, so the pair reads as one
         integration rather than two unrelated tools. "Llama 3" is what the
         résumé and CareGPT both state — the point release is not recorded
         anywhere, so it is not claimed. */
      { name: "Llama 3", note: "via Ollama" },
    ],
  },
  {
    id: "realtime",
    label: "Real-Time AI",
    caption: "Low-latency voice and streaming AI applications.",
    icon: "signal",
    technical: true,
    items: [{ name: "LiveKit" }],
  },
  {
    id: "web",
    label: "Web Development",
    caption: "The application layer that puts a model in front of a person.",
    icon: "layout",
    technical: true,
    items: [
      { name: "Flask" },
      { name: "HTML" },
      { name: "CSS" },
      { name: "JavaScript" },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    caption: "Reserved — no verified entries yet.",
    icon: "app",
    technical: true,
    items: [],
  },
  {
    id: "soft",
    label: "Soft Skills",
    caption: "How the work gets delivered.",
    icon: "sparkles",
    technical: false,
    items: [{ name: "Communication" }, { name: "Problem-Solving" }],
  },
];

/** Groups that have entries — technical or not. */
export const populatedSkillGroups: readonly SkillGroup[] = skillGroups.filter(
  (group) => group.items.length > 0,
);

/**
 * The technology ledger the Tech Stack grid renders: populated, technical,
 * numbered in order. Soft skills are not in here by construction.
 */
export const technicalSkillGroups: readonly NumberedSkillGroup[] =
  populatedSkillGroups.filter((group) => group.technical).map((group, i) => ({
    ...group,
    index: String(i + 1).padStart(2, "0"),
  }));

/** Soft skills, rendered apart from the grid. */
export const softSkills: readonly Skill[] =
  skillGroups.find((group) => group.id === "soft")?.items ?? [];

/** Distinct technologies in the grid — the number quoted in the section lede. */
export const technicalSkillCount: number = technicalSkillGroups.reduce(
  (sum, group) => sum + group.items.length,
  0,
);

export const totalSkillCount: number = skillGroups.reduce(
  (sum, group) => sum + group.items.length,
  0,
);

/**
 * Throws if one technology has been filed under two categories. Structural
 * decision 3 above is the kind of rule that quietly rots the next time someone
 * adds an entry, so it is checked rather than trusted. Called from the Tech
 * Stack component in development only.
 */
export function verifySkillUniqueness(): void {
  const seen = new Map<string, SkillCategoryId>();
  const duplicates: string[] = [];

  for (const group of skillGroups) {
    for (const item of group.items) {
      const first = seen.get(item.name);
      if (first) {
        duplicates.push(`${item.name} (in "${first}" and "${group.id}")`);
        continue;
      }
      seen.set(item.name, group.id);
    }
  }

  if (duplicates.length > 0) {
    throw new Error(
      `[skills] A technology is filed under more than one category: ${duplicates.join(
        ", ",
      )}. Put it where it does its job, once.`,
    );
  }
}
