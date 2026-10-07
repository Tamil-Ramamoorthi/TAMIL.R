/**
 * WHAT I DO
 * Capability areas, each backed by skills and projects that already exist.
 * No capability is claimed that is not supported by src/data/skills.ts.
 *
 * COMPUTER VISION IS DELIBERATELY ABSENT
 * --------------------------------------
 * It is a natural sixth area for an AI engineer and it was asked for, but
 * nothing in src/data backs it — no OpenCV, no CNN, no image pipeline, no
 * project. Listing it would be the one thing this file exists to prevent.
 * Add the entry the moment a real vision skill or project lands in the data.
 */

import type { IconKey } from "./personal";

export interface Service {
  readonly id: string;
  readonly index: string;
  readonly title: string;
  readonly description: string;
  /** Concrete, verified specifics shown as bracketed tags. */
  readonly details: readonly string[];
  readonly icon: IconKey;
}

export const services: readonly Service[] = [
  {
    id: "ai-ml",
    index: "01",
    title: "Machine Learning",
    description:
      "Training and evaluating models on prepared datasets, with Random Forest classifiers behind the prediction work.",
    details: ["Machine Learning", "Deep Learning", "Random Forest"],
    icon: "brain",
  },
  {
    id: "genai",
    index: "02",
    title: "Generative AI",
    description:
      "Integrating LLM tooling into applications — hosted APIs and locally served models alike.",
    details: ["Google Gemini API", "Ollama", "Llama 3"],
    icon: "sparkles",
  },
  {
    id: "ai-apps",
    index: "03",
    title: "AI Applications",
    description:
      "Wrapping trained models in Flask services so they can be used, not just reported on.",
    details: ["Flask", "Scikit-learn", "End-to-end ML"],
    icon: "app",
  },
  {
    id: "data-science",
    index: "04",
    title: "Data Science",
    description:
      "Cleaning and preprocessing raw data, then visualising what the results actually say.",
    details: ["Pandas", "Data Preprocessing", "Data Visualization"],
    icon: "chart",
  },
  {
    id: "full-stack-ai",
    index: "05",
    title: "Full-Stack AI",
    description:
      "Carrying a model the rest of the way — from the Flask service to an interface someone can actually read.",
    details: ["HTML", "CSS", "JavaScript"],
    icon: "code",
  },
];
