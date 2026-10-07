/**
 * PERSONAL / IDENTITY DATA
 * Verified information only. Anything not yet supplied is typed as nullable
 * and left `null` so the UI renders a placeholder instead of inventing text.
 */

export type IconKey =
  | "mail"
  | "github"
  | "linkedin"
  | "resume"
  | "location"
  | "arrow-right"
  | "arrow-up-right"
  | "chevron-right"
  | "chevron-left"
  | "brain"
  | "sparkles"
  | "chart"
  | "grid"
  | "database"
  | "signal"
  | "layout"
  | "app"
  | "code";

export interface SocialLink {
  readonly id: string;
  /** Uppercase label used in navigation and the contact grid. */
  readonly label: string;
  /** Human-readable value, e.g. the handle or address. */
  readonly display: string;
  readonly href: string;
  readonly icon: IconKey;
  readonly external: boolean;
}

export interface Language {
  readonly name: string;
  readonly level: string;
}

export const personal = {
  name: "Tamil Ramamoorthi",
  /** Wordmark / short form used by the navbar and preloader. */
  shortName: "Tamil R",
  initials: "TR",

  title: "AI / ML Engineer | Machine Learning & GenAI Intern",
  /** Compact role line for the hero. */
  role: "AI / ML Engineer",

  location: "Namakkal, Tamil Nadu, India",
  email: "tamil15032007@gmail.com",

  /** Hero keyword strip. */
  keywords: ["Machine Learning", "GenAI", "Data"],

  /** Broader positioning used by the About and What I Do sections. */
  positioning: [
    "AI",
    "Machine Learning",
    "Data Science",
    "Generative AI",
    "Software Development",
    "Interactive Web",
  ],

  /** Professional summary, taken from the resume. Claims are not embellished. */
  summary: [
    "AI & Data Science undergraduate with hands-on experience in Python, Machine Learning, Deep Learning and data preprocessing.",
    "Experience includes Machine Learning internships and self-driven AI/ML projects.",
    "Experience includes building end-to-end ML applications using Flask and Random Forest, and integrating LLM tools including the Google Gemini API and Ollama/Llama 3.",
  ],

  /**
   * Second About paragraph. Portfolio copy written from the verified summary
   * above — it restates what the résumé already claims (preprocessing, model
   * development, deployment) and adds no new capability.
   */
  aboutStatement:
    "My work focuses on turning machine learning concepts into practical applications — from data preprocessing and model development to deploying end-to-end AI applications.",

  /**
   * The four areas the work currently sits in. A narrower cut of
   * `positioning`, for the About focus block. Every entry is already declared
   * elsewhere in the portfolio data — "AI Applications" in the CodeAlpha
   * credential, the rest in `positioning` and `skillGroups`.
   */
  currentFocus: [
    "Machine Learning",
    "Generative AI",
    "AI Applications",
    "Data Science",
  ],

  languages: [
    { name: "Tamil", level: "Native" },
    { name: "English", level: "Professional Proficiency" },
  ] as readonly Language[],

  /** Closing statement for the contact section. */
  closingStatement: "Let’s build something intelligent.",

  /**
   * Supporting copy under the closing statement. States what is being looked
   * for and nothing more — no availability date, notice period or rate, none
   * of which the resume records.
   */
  contactIntro:
    "I am an AI / ML engineer and a machine learning and generative AI intern, looking for internships, collaborations and projects where the work is genuinely AI. If you are building something along those lines, I would like to hear about it.",

  /** Prefills the subject line on the primary contact CTA. */
  contactSubject: "AI / ML opportunity",
} as const;

/**
 * `mailto:` for the primary CTA, with the subject prefilled. Built here rather
 * than in a component so the address is declared exactly once.
 */
export const mailtoHref: string = `mailto:${personal.email}?subject=${encodeURIComponent(
  personal.contactSubject,
)}`;

/* ==========================================================================
   SOCIAL / CONTACT LINKS
   Update a URL here and every component that links out follows.
   ========================================================================== */

export const socials: readonly SocialLink[] = [
  {
    id: "email",
    label: "Email",
    display: personal.email,
    href: `mailto:${personal.email}`,
    icon: "mail",
    external: false,
  },
  {
    id: "github",
    label: "GitHub",
    display: "github.com/Tamil-Ramamoorthi",
    href: "https://github.com/Tamil-Ramamoorthi",
    icon: "github",
    external: true,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    display: "linkedin.com/in/tamil-kalavathi",
    href: "https://www.linkedin.com/in/tamil-kalavathi",
    icon: "linkedin",
    external: true,
  },
];

const socialMap = new Map(socials.map((s) => [s.id, s]));

export const getSocial = (id: string): SocialLink | undefined =>
  socialMap.get(id);
