/**
 * PROJECTS
 * ========
 * Four real builds. Every claim here is traceable to the project repository
 * and its README — nothing is inferred from what a project "probably" does,
 * and no URL is ever invented.
 *
 * DELIBERATE ABSENCES
 * -------------------
 *  - `liveDemo` is null on all four. None of them is deployed, so there is no
 *    demo button to render; `ActionLink` shows a disabled control rather than a
 *    dead link.
 *  - `status` is null. Nothing in the source material states a lifecycle
 *    stage, so the chip stays off rather than guessing "live" or "completed".
 *  - `problem` / `solution` await a written case study.
 *  - Every screenshot slot is `ready: false`. Slots are declared with the
 *    names of the real surfaces each project has, so supplying an image is:
 *    drop the file at the declared path, flip `ready`. Until then the media
 *    column is omitted entirely — see ProjectRow.
 *
 * CLAIM DISCIPLINE
 * ----------------
 * CareGPT is an educational risk-prediction project, not a diagnostic or
 * clinical system. The credit model predicts on a dataset, it is not a lending
 * service. Tom 0.1 consumes a hosted realtime API, it is not a trained model.
 * The password tool is deterministic entropy maths, not AI. The wording below
 * is written to those limits and should stay that way.
 */

import { projectShot, type ProjectShot } from "../config/assets";

export type ProjectStatus = "live" | "in-progress" | "completed";

/**
 * A figure the project README reports. Always rendered under a "reported by
 * the project" framing — these are the author numbers on their own split, not
 * an independent benchmark.
 */
export interface ProjectMetric {
  readonly label: string;
  readonly value: string;
}

export interface Project {
  readonly id: string;
  /** Zero-padded ledger number, e.g. "01". */
  readonly index: string;
  readonly title: string;
  /** One-line descriptor under the title. */
  readonly subtitle: string;
  /** Compact domain label for the ledger, e.g. "AI Healthcare / ML". */
  readonly category: string;
  readonly description: string | null;
  readonly problem: string | null;
  readonly solution: string | null;
  readonly technologies: readonly string[];
  /** Selected capabilities, as the repository documents them. */
  readonly features: readonly string[];
  /** Figures reported by the project itself; empty when none are stated. */
  readonly metrics: readonly ProjectMetric[];
  /**
   * Declared media slots. Not-ready slots render nothing at all — they exist
   * so a screenshot can be added without touching a component.
   */
  readonly screenshots: readonly ProjectShot[];
  readonly github: string | null;
  readonly liveDemo: string | null;
  readonly status: ProjectStatus | null;
  /** Display preference only — reorder or re-flag freely. */
  readonly featured: boolean;
}

export const projects: readonly Project[] = [
  {
    id: "caregpt-ai",
    index: "01",
    title: "CareGPT AI",
    subtitle: "Heart Disease Risk Prediction & AI Healthcare Assistant",
    category: "AI Healthcare / Machine Learning",
    description:
      "An educational AI healthcare project in two halves: a Random Forest classifier that estimates heart-disease risk from UCI-style input features, and a healthcare assistant that answers questions in natural language. The assistant runs Llama 3 locally through Ollama, so the conversation never leaves the machine. It is a learning build for working through the prediction workflow end to end — not a diagnostic tool.",
    problem: null,
    solution: null,
    technologies: [
      "Python",
      "Flask",
      "Random Forest",
      "Ollama",
      "Llama 3",
      "HTML",
      "CSS",
      "JavaScript",
    ],
    features: [
      "Heart-disease risk prediction from UCI-style input features",
      "Trained Random Forest model served by a Flask application",
      "AI healthcare assistant on a locally hosted Llama 3",
      "End-to-end prediction workflow, input through result",
    ],
    metrics: [],
    screenshots: [
      projectShot("caregpt-ai", "01-prediction-form.jpg", "Prediction Form"),
      projectShot("caregpt-ai", "02-risk-result.jpg", "Risk Result"),
      projectShot("caregpt-ai", "03-assistant.jpg", "Healthcare Assistant"),
    ],
    github:
      "https://github.com/Tamil-Ramamoorthi/CodeAlpha_CAREGPT-Disease-Prediction-from-Medical-Data-",
    liveDemo: null,
    status: null,
    featured: true,
  },
  {
    id: "ai-credit-scoring",
    index: "02",
    title: "AI Credit Score Prediction",
    subtitle: "Loan Eligibility Prediction with Confidence & Risk Level",
    category: "Machine Learning / FinTech",
    description:
      "A web application that predicts whether a customer would be classed as eligible for a loan, from personal details, financial information, credit history, loan details and credit score. A Random Forest classifier returns an approval or rejection alongside its confidence and a risk level, and the interface turns that into plain financial suggestions. The output is a model prediction on a dataset, not a lending decision.",
    problem: null,
    solution: null,
    technologies: [
      "Python",
      "Flask",
      "Scikit-learn",
      "Random Forest",
      "Pandas",
      "NumPy",
      "Joblib",
      "HTML5",
      "CSS3",
      "JavaScript",
    ],
    features: [
      "Loan approval and rejection prediction",
      "Prediction confidence and risk level with every result",
      "AI-based financial suggestions from the model output",
      "Real-time prediction in a responsive web interface",
      "Thirteen input features, from annual income to previous loans",
    ],
    metrics: [
      { label: "Training accuracy", value: "100%" },
      { label: "Testing accuracy", value: "93%" },
    ],
    screenshots: [
      projectShot("ai-credit-scoring", "01-input-form.jpg", "Applicant Form"),
      projectShot("ai-credit-scoring", "02-prediction.jpg", "Prediction"),
      projectShot("ai-credit-scoring", "03-suggestions.jpg", "Suggestions"),
    ],
    github:
      "https://github.com/Tamil-Ramamoorthi/CodeAlpha_-Credit_Scoring_Model-",
    liveDemo: null,
    status: null,
    featured: true,
  },
  {
    id: "tom-0-1",
    index: "03",
    title: "Tom 0.1",
    subtitle: "Real-Time Voice AI Assistant",
    category: "Voice AI / Generative AI",
    description:
      "A voice assistant you talk to rather than type at. LiveKit Agents carries the audio and the Google Gemini Realtime API handles the listen-think-speak loop, so a reply comes back as natural speech in the Puck voice instead of text. Noise cancellation keeps the input clean, and a custom conversational personality gives it a consistent character rather than a default assistant tone.",
    problem: null,
    solution: null,
    technologies: [
      "Python 3.9+",
      "LiveKit Agents",
      "Google Gemini Realtime API",
      "Noise Cancellation (BVC)",
      "python-dotenv",
    ],
    features: [
      "Real-time, spoken two-way conversation",
      "Listen to think to speak loop over realtime audio",
      "Natural voice output using the Puck voice",
      "Background noise cancellation on the input",
      "Custom conversational personality and greeting",
    ],
    metrics: [],
    screenshots: [
      projectShot("tom-0-1", "01-session.jpg", "Live Session"),
      projectShot("tom-0-1", "02-agent-console.jpg", "Agent Console"),
    ],
    github: "https://github.com/Tamil-Ramamoorthi/TOM0.1-",
    liveDemo: null,
    status: null,
    featured: false,
  },
  {
    id: "password-analyzer",
    index: "04",
    title: "Password Analyzer & Generator",
    subtitle: "Entropy-Based Strength Analysis and Generation",
    category: "Security / Web",
    description:
      "A browser tool that scores a password as it is typed. Strength comes from entropy — length x log2 of the character-set size — combined with checks for upper and lower case, numbers, symbols and repeated patterns, each surfaced as a checklist rather than one opaque score. It also generates six strong passwords on demand, with regeneration and a visibility toggle. Vanilla JavaScript throughout: no backend, no network calls.",
    problem: null,
    solution: null,
    technologies: ["HTML5", "CSS3", "JavaScript", "Vanilla JavaScript"],
    features: [
      "Real-time strength analysis as you type",
      "Entropy calculation: length x log2(character-set size)",
      "Weak-pattern and repetition detection",
      "Checklist validation with targeted suggestions",
      "Generates six strong passwords, with regeneration",
      "Password visibility toggle",
    ],
    metrics: [],
    screenshots: [
      projectShot("password-analyzer", "01-analyzer.jpg", "Strength Analyzer"),
      projectShot("password-analyzer", "02-generator.jpg", "Generator"),
    ],
    github: "https://github.com/Tamil-Ramamoorthi/PASSWORD_ANALYSIS",
    liveDemo: null,
    status: null,
    featured: false,
  },
];

export const featuredProjects: readonly Project[] = projects.filter(
  (p) => p.featured,
);

export const getProject = (id: string): Project | undefined =>
  projects.find((p) => p.id === id);

/**
 * Screenshots whose file has actually been supplied. The media column renders
 * only from this — a declared-but-empty slot shows nothing rather than a
 * stand-in that could be mistaken for the real screen.
 */
export const readyScreenshots = (
  project: Project,
): readonly ProjectShot[] => project.screenshots.filter((shot) => shot.ready);

/** True when a project has enough supplied detail to be worth expanding. */
export function hasProjectDetail(project: Project): boolean {
  return Boolean(
    project.description ||
      project.problem ||
      project.solution ||
      project.features.length > 0 ||
      project.metrics.length > 0,
  );
}
