/**
 * ORBIT TECHNOLOGIES
 * ==================
 * The technologies that orbit the AI portrait once the hero has transformed.
 *
 * EVERY entry must be backed by the portfolio's own data. That is not a
 * convention here, it is checked: `verifyOrbitTechnologies()` runs in
 * development and throws if an entry loses its evidence. The orbit is a claim
 * about what this engineer actually uses, so it may not contain anything the
 * portfolio has not already declared.
 *
 * Evidence is one of two things:
 *   - a skill  — the exact `Skill.name` in `src/data/skills.ts`;
 *   - the project repositories — GitHub, which the shipped projects in
 *     `src/data/projects.ts` are hosted on. It is a tool the work runs
 *     through rather than a skill, so it is evidenced by the repositories
 *     instead of being listed in the Tech Stack.
 *
 * WHAT WAS DELIBERATELY LEFT OUT
 * ------------------------------
 * MongoDB, React, PyTorch, TensorFlow, OpenAI, LangChain and FastAPI are all
 * plausible for an AI/ML portfolio and all have icons readily available — but
 * none of them appear in the résumé, the skills or any project, so none of
 * them appear here. Add the skill first and the entry becomes a one-line
 * addition.
 */

import { projects } from "./projects";
import { skillGroups } from "./skills";

/**
 * Marks for the orbit. A separate union from the shared `IconKey` on purpose:
 * these resolve inside the lazily-loaded orbit chunk, so the brand logos stay
 * out of the main bundle until the hero needs them.
 */
export type TechIconKey =
  | "python"
  | "javascript"
  | "html"
  | "css"
  | "mysql"
  | "sklearn"
  | "gemini"
  | "ollama"
  | "flask"
  | "github";

export type TechCategory = "programming" | "database" | "ai-ml" | "development";

/** Which orbital layer a node rides on — an `orbitLayout.rings` id. */
export type OrbitLayerId = "inner" | "middle" | "outer";

export type TechEvidence =
  | { readonly skill: string }
  | { readonly repositories: true };

export interface OrbitTechnology {
  readonly id: string;
  /** Short label for the orbit. */
  readonly label: string;
  readonly icon: TechIconKey;
  readonly category: TechCategory;
  /** What in the portfolio data proves this entry. Verified in development. */
  readonly evidence: TechEvidence;
  readonly orbit: OrbitLayerId;
  /**
   * Starting position on the layer, in turns: 0 = right, 0.25 = bottom (the
   * near side, in front of the shirt), 0.5 = left, 0.75 = top (the far side,
   * behind the portrait).
   */
  readonly position: number;
  /**
   * Multiplier on the node's own float and glyph sway. Deliberately NOT on its
   * orbital speed: every node on a layer shares that layer's rate, so two
   * nodes can never overtake and collide.
   */
  readonly animationSpeed: number;
  /**
   * Priority. Lower numbers survive when the device budget reduces the icon
   * count. The top five span all three layers, so a phone still reads as a
   * layered system rather than one crowded ring.
   */
  readonly rank: number;
}

export const orbitTechnologies: readonly OrbitTechnology[] = [
  /* ---------- Inner orbit ---------- */
  {
    id: "python",
    label: "Python",
    icon: "python",
    category: "programming",
    evidence: { skill: "Python" },
    orbit: "inner",
    position: 0.75,
    animationSpeed: 1,
    rank: 0,
  },
  {
    id: "javascript",
    label: "JavaScript",
    icon: "javascript",
    category: "programming",
    evidence: { skill: "JavaScript" },
    orbit: "inner",
    position: 0.08,
    animationSpeed: 1.18,
    rank: 3,
  },
  {
    id: "mysql",
    label: "MySQL",
    icon: "mysql",
    category: "database",
    evidence: { skill: "MySQL" },
    orbit: "inner",
    position: 0.42,
    animationSpeed: 0.94,
    rank: 5,
  },

  /* ---------- Middle orbit ---------- */
  {
    id: "flask",
    label: "Flask",
    icon: "flask",
    category: "development",
    evidence: { skill: "Flask" },
    orbit: "middle",
    position: 0,
    animationSpeed: 0.92,
    rank: 2,
  },
  {
    id: "sklearn",
    label: "Scikit-learn",
    icon: "sklearn",
    category: "ai-ml",
    evidence: { skill: "Scikit-learn" },
    orbit: "middle",
    position: 0.2,
    animationSpeed: 1.12,
    rank: 4,
  },
  {
    id: "html",
    label: "HTML5",
    icon: "html",
    category: "programming",
    evidence: { skill: "HTML" },
    orbit: "middle",
    position: 0.4,
    animationSpeed: 1.06,
    rank: 8,
  },
  {
    id: "github",
    label: "GitHub",
    icon: "github",
    category: "development",
    evidence: { repositories: true },
    orbit: "middle",
    position: 0.6,
    animationSpeed: 1.1,
    rank: 6,
  },
  {
    id: "css",
    label: "CSS3",
    icon: "css",
    category: "programming",
    evidence: { skill: "CSS" },
    orbit: "middle",
    position: 0.8,
    animationSpeed: 0.96,
    rank: 9,
  },

  /* ---------- Outer orbit ---------- */
  {
    id: "gemini",
    label: "Gemini",
    icon: "gemini",
    category: "ai-ml",
    evidence: { skill: "Google Gemini API" },
    orbit: "outer",
    position: 0.62,
    animationSpeed: 0.9,
    rank: 1,
  },
  {
    // Ollama is the runtime, Llama 3 the model it serves — one node, as the
    // résumé pairs them.
    id: "ollama",
    label: "Ollama · Llama 3",
    icon: "ollama",
    category: "ai-ml",
    evidence: { skill: "Ollama" },
    orbit: "outer",
    position: 0.12,
    animationSpeed: 0.84,
    rank: 7,
  },
];

/** Every skill name declared anywhere in the skills data. */
function declaredSkillNames(): Set<string> {
  const names = new Set<string>();
  for (const group of skillGroups) {
    for (const item of group.items) names.add(item.name);
  }
  return names;
}

function describeEvidence(evidence: TechEvidence): string {
  return "skill" in evidence
    ? `skill "${evidence.skill}"`
    : "a project with a GitHub repository";
}

/**
 * Throws if the orbit claims a technology the portfolio has not declared.
 * Called once from the orbit component in development.
 */
export function verifyOrbitTechnologies(): void {
  const declared = declaredSkillNames();
  const hasRepositories = projects.some((project) => Boolean(project.github));

  const unverified = orbitTechnologies
    .filter((tech) =>
      "skill" in tech.evidence
        ? !declared.has(tech.evidence.skill)
        : !hasRepositories,
    )
    .map(
      (tech) => `${tech.label} (looking for ${describeEvidence(tech.evidence)})`,
    );

  if (unverified.length > 0) {
    throw new Error(
      `[technologies] Orbit entries without evidence in src/data: ${unverified.join(
        ", ",
      )}. Add the evidence, or remove it from the orbit — the orbit may not invent technologies.`,
    );
  }
}

/** The `count` highest-priority technologies, for reduced device budgets. */
export function orbitSubset(count: number): readonly OrbitTechnology[] {
  return [...orbitTechnologies]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, Math.max(0, count));
}
