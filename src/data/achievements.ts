/**
 * ACHIEVEMENTS, CERTIFICATIONS & RESEARCH
 * =======================================
 * Five editorial ledgers rather than one certificate wall: achievements,
 * research (its own model, below), certifications, hackathons & competitions,
 * and other credentials.
 *
 * CLAIM DISCIPLINE
 * ----------------
 * Participation is recorded as participation. HackMatrix, INEXORA and the JCT
 * SDG hackathon all carry `credential: "Participant"`; none is upgraded to
 * finalist, placed or winner. Techno 2K25 is the one placed result and says
 * Runner-up because that is what was stated.
 *
 * The Overall Topper award is scoped to the programme, as the certificate
 * records it — not described as university-wide.
 *
 * WHERE A FACT WAS NOT SUPPLIED, THE FIELD IS NULL
 * ------------------------------------------------
 * A null renders nothing. It is never padded out with a plausible date or
 * institution. Fill one in here and the UI picks it up with no component
 * change.
 *
 * TWO ENTRIES CARRY AN OPEN QUESTION, recorded on the entry itself as `note`:
 *   - Techno 2K25: the event name spelling and the award wording want
 *     checking against the certificate.
 *   - The technical workshop: its exact title is not legible, so it is not
 *     reconstructed.
 *
 * PRIVACY
 * -------
 * No field in this file may hold a certificate serial or registration number,
 * a date of birth, a candidate identifier or QR-code content. The model has no
 * field for them on purpose, and none should be added. Certificate images are
 * supporting evidence, not a place to publish document identifiers.
 *
 * IMAGES
 * ------
 * Every `certificate` slot is declared and NOT ready — no certificate image
 * has been supplied to the repository. Unready slots render nothing at all: no
 * thumbnail, no "View certificate" control. See
 * public/images/achievements/README.md for the crop rules.
 */

import {
  achievementAsset,
  assets,
  type AssetRef,
  type CaptionedAsset,
} from "../config/assets";

export type AchievementGroupId =
  | "achievements"
  | "certifications"
  | "hackathons"
  | "credentials";

/**
 * An outbound proof link. Only ever a URL that was supplied — the two
 * LinkedIn posts below are the two that were given, and no profile or post URL
 * is constructed from a handle.
 */
export interface ExternalProof {
  readonly id: string;
  /** CTA label. Never a raw URL — those are not shown in the UI. */
  readonly label: string;
  readonly href: string;
}

/** An in-page link to a section or project this entry evidences. */
export interface RelatedRef {
  readonly label: string;
  /** In-page anchor. Never an invented external URL. */
  readonly href: string;
  /** Optional one-line context, e.g. what a linked project is. */
  readonly description?: string;
}

export interface AchievementEntry {
  readonly id: string;
  /** Small editorial label: Achievement, Certification, Hackathon, Credential. */
  readonly kindLabel: string;
  /** Headline, in the certificate's own words. */
  readonly title: string;
  /** Issuing or awarding body. Null when it was not stated. */
  readonly organization: string | null;
  /** Where it was held or awarded. Null when not stated. */
  readonly location: string | null;
  /** Supporting line: the programme, event format or qualification detail. */
  readonly detail: string | null;
  /** As printed, e.g. "15 April 2026". Null when no date was stated. */
  readonly date: string | null;
  /** What the certificate confirms, e.g. "Participant", "First Class". */
  readonly credential: string | null;
  readonly description: string | null;
  /** Large figure, e.g. a CGPA or a typing speed. */
  readonly metric: string | null;
  /** Label printed above the metric. */
  readonly metricLabel: string | null;
  /** Compact skill metadata. Empty where none was supplied. */
  readonly skills: readonly string[];
  /**
   * An honest caveat printed under the entry — used where a certificate is
   * only partly legible. Never used to paper over an invented claim.
   */
  readonly note: string | null;
  readonly certificate: CaptionedAsset | null;
  /**
   * A second, non-certificate visual — e.g. an award presentation photograph.
   * Presented as a supporting image, never as another certificate.
   */
  readonly supporting: CaptionedAsset | null;
  /**
   * Whether this entry is part of the curated, visible portfolio.
   *
   * The section is deliberately curated rather than exhaustive: an entry whose
   * certificate has not been supplied stays declared here but is filtered out
   * of the render, so nothing ever appears as an empty or broken row. Flip to
   * `true` once its asset is in and it should be shown.
   */
  readonly active: boolean;
  /** In-page links to the sections or projects this evidences. */
  readonly related: readonly RelatedRef[];
  /** Outbound proof links, e.g. a LinkedIn post. Empty when none exists. */
  readonly proof: readonly ExternalProof[];
  /** Carries the strongest visual weight in its group. */
  readonly featured: boolean;
}

export interface AchievementGroup {
  readonly id: AchievementGroupId;
  readonly label: string;
  /** One line describing what the group collects. */
  readonly caption: string;
  readonly items: readonly AchievementEntry[];
}

export const achievementGroups: readonly AchievementGroup[] = [
  {
    id: "achievements",
    label: "Achievements",
    caption: "Academic recognition.",
    items: [
      {
        id: "overall-topper",
        kindLabel: "Achievement",
        title: "Overall Topper",
        organization: "PGP College of Engineering and Technology",
        location: null,
        detail: "II Year Artificial Intelligence and Data Science",
        date: "15 April 2026",
        credential: "Certificate of Merit",
        description:
          "Recognised as the Overall Topper for outstanding academic performance in Artificial Intelligence and Data Science, achieving an 8.52 CGPA in the Anna University examinations of November/December 2025.",
        metric: "8.52",
        metricLabel: "CGPA",
        skills: [],
        note: null,
        certificate: achievementAsset(
          "overall-topper-certificate.jpg",
          "Certificate of Merit",
          "PGP College of Engineering and Technology Certificate of Merit presented to Tamil R as Overall Topper in Academic Results with 8.52 CGPA",
          true,
        ),
        // The award presentation photograph. A supporting visual, NOT a
        // second certificate — one achievement, two images.
        supporting: achievementAsset(
          "overall-topper-award.jpg",
          "Award presentation",
          "Tamil R receiving the Overall Topper Certificate of Merit at PGP College of Engineering and Technology",
          true,
        ),
        active: true,
        related: [{ label: "Education", href: "#education" }],
        proof: [
          {
            id: "linkedin-post",
            label: "View on LinkedIn",
            href: "https://lnkd.in/p/g6Hh7ms8",
          },
        ],
        featured: true,
      },
    ],
  },
  {
    id: "certifications",
    label: "Professional Development",
    caption: "Completed internships and technical programmes.",
    items: [
      {
        id: "marcellotech-internship",
        kindLabel: "Certification",
        title: "Machine Learning Intern",
        organization: "MarcelloTech",
        location: "Tiruchirappalli, Tamil Nadu",
        detail: "Artificial Intelligence & Machine Learning — one month",
        date: "15 June 2026 — 14 July 2026",
        credential: "Certificate of Completion",
        description:
          "Completed a one-month hands-on internship in Artificial Intelligence and Machine Learning, gaining practical experience with machine learning workflows, regression and classification algorithms, data preprocessing, model training, and evaluation using Python and Scikit-learn.",
        metric: null,
        metricLabel: null,
        skills: [
          "Machine Learning",
          "Data Preprocessing",
          "Regression",
          "Classification",
          "Python",
          "Scikit-learn",
          "Model Evaluation",
        ],
        note: null,
        certificate: achievementAsset(
          "marcello-tech-internship.jpg",
          "Internship certificate",
          "Marcello Tech certificate of completion awarded to Tamil R for a one month internship programme in Artificial Intelligence and Machine Learning, 15 June to 14 July 2026",
          true,
        ),
        supporting: null,
        // The role itself lives in Experience; this is its credential, so it
        // links there rather than restating the role.
        active: true,
        related: [{ label: "Experience", href: "#experience" }],
        proof: [],
        featured: true,
      },
      {
        id: "codealpha-internship",
        kindLabel: "Certification",
        title: "Machine Learning Intern",
        organization: "CodeAlpha",
        location: "Remote",
        detail: "Machine Learning Internship",
        date: "June 2026 — Present",
        credential: "Certificate of Completion",
        description:
          "Completed a Machine Learning internship focused on developing practical AI solutions, including a Credit Score Prediction model and the CareGPT AI healthcare screening project. Strengthened practical skills in data preprocessing, model development, evaluation, and deployment of machine learning applications.",
        metric: null,
        metricLabel: null,
        skills: [
          "Machine Learning",
          "Deep Learning",
          "Data Preprocessing",
          "Model Development",
          "Random Forest",
          "Python",
        ],
        note: null,
        certificate: achievementAsset(
          "codealpha-certificate.jpg",
          "Internship certificate",
          "CodeAlpha machine learning internship completion certificate",
        ),
        supporting: null,
        active: false,
        related: [
          { label: "Experience", href: "#experience" },
          {
            label: "CareGPT AI",
            href: "#project-caregpt-ai",
            description:
              "AI-powered healthcare screening application using a Random Forest model with a Flask interface and AI-assisted interaction through Ollama / Llama 3.",
          },
          {
            label: "AI Credit Score Prediction",
            href: "#project-ai-credit-scoring",
          },
        ],
        proof: [],
        featured: true,
      },
      {
        id: "robotic-diagnostics-workshop",
        kindLabel: "Certification",
        title: "Technical Workshop",
        organization: "PGP College of Engineering and Technology",
        location: null,
        // Reproduced only as far as it is legible. The missing words are NOT
        // reconstructed — see `note`.
        detail: "Implementation of Smart … Robotic Diagnostics",
        date: null,
        credential: "Participant",
        description:
          "Completed a technical workshop focused on developing practical knowledge and exposure to emerging technology concepts.",
        metric: null,
        metricLabel: null,
        skills: [],
        note: "Exact workshop title not fully legible on the certificate — to be replaced with the precise topic.",
        certificate: achievementAsset(
          "technical-workshop.jpg",
          "Workshop certificate",
          "Technical workshop certificate from PGP College of Engineering and Technology",
        ),
        supporting: null,
        active: false,
        related: [],
        proof: [],
        featured: false,
      },
    ],
  },
  {
    id: "hackathons",
    label: "Hackathons & Competitions",
    caption:
      "Events entered. Only Techno 2K25 records a placed result; the rest are participation.",
    items: [
      {
        id: "techno-2k25",
        kindLabel: "Competition",
        title: "Techno 2K25",
        organization: "PGP College of Engineering and Technology",
        location: null,
        detail: null,
        date: null,
        credential: "Runner-up",
        description:
          "Recognised for performance and participation in the Techno 2K25 event organised by PGP College of Engineering and Technology.",
        metric: null,
        metricLabel: null,
        skills: [],
        // The event name spelling varied across the source material, and the
        // exact award wording wants confirming against the certificate.
        note: "Event name spelling and award wording to be confirmed against the certificate.",
        certificate: achievementAsset(
          "techno-2k25.jpg",
          "Runner-up certificate",
          "Techno 2K25 certificate",
        ),
        supporting: null,
        active: false,
        related: [],
        proof: [],
        featured: true,
      },
      {
        id: "hackmatrix-2026",
        kindLabel: "Hackathon",
        title: "HackMatrix 2026",
        organization:
          "Nandha College of Technology — Department of Information Technology",
        location: null,
        detail: "24-hour national-level hackathon",
        date: null,
        credential: "Participant",
        description:
          "Participated in HackMatrix 2026, a 24-hour national-level hackathon focused on technology innovation, collaboration, and rapid solution development.",
        metric: "24",
        metricLabel: "Hours",
        skills: [
          "Hackathon",
          "Innovation",
          "Problem Solving",
          "Teamwork",
          "Rapid Prototyping",
        ],
        note: null,
        certificate: achievementAsset(
          "hackmatrix-2026.jpg",
          "Participation certificate",
          "HackMatrix 2026 certificate of participation, Nandha College of Technology",
        ),
        supporting: null,
        active: false,
        related: [],
        proof: [],
        featured: false,
      },
      {
        id: "inexora-hackathon",
        kindLabel: "Hackathon",
        title: "INEXORA — 24 Hours Hackathon",
        // Not supplied: no organiser was stated for this certificate.
        organization: null,
        location: null,
        detail: "24-hour hackathon",
        date: null,
        credential: "Participant",
        description:
          "Participated in a 24-hour hackathon focused on collaborative problem-solving, innovation, and building technology-driven solutions under a time-constrained environment.",
        metric: "24",
        metricLabel: "Hours",
        skills: [
          "Hackathon",
          "Innovation",
          "Problem Solving",
          "Teamwork",
          "Rapid Prototyping",
        ],
        note: null,
        certificate: achievementAsset(
          "inexora-24h-hackathon.jpg",
          "Participation certificate",
          "INEXORA 24 hours hackathon certificate",
        ),
        supporting: null,
        active: false,
        related: [],
        proof: [],
        featured: false,
      },
      {
        id: "jct-sdg-hackathon-2026",
        kindLabel: "Hackathon",
        title: "JCT SDG Hackathon 2026",
        organization: "JCT College of Engineering and Technology",
        location: null,
        detail: "SDG hackathon",
        date: null,
        credential: "Participant",
        description:
          "Participated in the JCT SDG Hackathon 2026, working in a collaborative innovation environment focused on developing sustainable, technology-driven solutions.",
        metric: null,
        metricLabel: null,
        skills: [
          "Innovation",
          "Problem Solving",
          "Teamwork",
          "Technology",
          "Sustainability",
        ],
        note: null,
        certificate: achievementAsset(
          "jct-sdg-hackathon-2026.jpg",
          "Participation certificate",
          "JCT SDG Hackathon 2026 certificate of participation",
        ),
        supporting: null,
        active: false,
        related: [],
        proof: [],
        featured: false,
      },
    ],
  },
  {
    id: "credentials",
    label: "Other Credentials",
    caption: "Examinations passed outside the degree.",
    items: [
      {
        id: "ncc-certificate-a",
        kindLabel: "Credential",
        title: "NCC A Certificate",
        organization: "National Cadet Corps — 2 (TN) BN NCC",
        location: "Directorate of Tamil Nadu, Puducherry & Andaman Nicobar",
        detail: "Certificate A examination",
        date: null,
        credential: "Passed",
        description:
          "Successfully completed the NCC A Certificate examination under the National Cadet Corps, demonstrating discipline, commitment, and participation in structured cadet training.",
        metric: null,
        metricLabel: null,
        skills: [],
        note: null,
        certificate: achievementAsset(
          "ncc-certificate-a.jpg",
          "NCC A Certificate",
          "National Cadet Corps Certificate A examination certificate",
        ),
        supporting: null,
        active: false,
        related: [],
        proof: [],
        featured: false,
      },
      {
        id: "typewriting-english",
        kindLabel: "Credential",
        title: "Junior Grade Typewriting — English",
        organization: "Government Technical Examinations, Tamil Nadu",
        location: null,
        detail: "Department of Technical Education",
        date: "February 2025",
        credential: "First Class",
        description:
          "Successfully completed the Junior Grade Typewriting examination in English with First Class at 30 words per minute.",
        metric: "30",
        metricLabel: "Words per minute",
        skills: [],
        note: null,
        certificate: achievementAsset(
          "typewriting-english.jpg",
          "Typewriting certificate",
          "Government of Tamil Nadu junior grade English typewriting certificate, first class",
        ),
        supporting: null,
        active: false,
        related: [],
        proof: [],
        featured: false,
      },
    ],
  },
];

/* ==========================================================================
   RESEARCH / PUBLICATION

   Lifted out of the grouped ledgers on purpose: a conference paper is not a
   certificate and should not render as a row in a list of them. It gets its
   own richer model and its own editorial card.

   WHAT IS DELIBERATELY ABSENT
   ---------------------------
   No DOI, journal, publisher, volume, issue, page range, indexing badge or
   citation count. None was supplied and none is guessable.

   `sources` IS ABOUT THE STUDY, NOT ABOUT THIS PAPER
   --------------------------------------------------
   Scopus and Web of Science are the databases the study DRAWS ITS DATA FROM.
   They are not a claim that this paper is indexed in either, and the UI labels
   them "Data analysed" for exactly that reason. Do not relabel this field.
   ========================================================================== */

export interface ResearchEntry {
  readonly id: string;
  /** Zero-padded ledger number. */
  readonly index: string;
  /** Main title, set as the display headline. */
  readonly title: string;
  /** The title's second half, set smaller beneath it. */
  readonly subtitle: string | null;
  /** As credited on the paper. */
  readonly author: string;
  readonly institution: string;
  readonly domain: string;
  /** Topic chips, e.g. "Industry 4.0". */
  readonly topics: readonly string[];
  /** What the paper examines. */
  readonly description: string;
  /** Databases the study draws its data from — NOT indexing claims. */
  readonly sources: readonly string[];
  /** Analytical methods the paper applies. */
  readonly methods: readonly string[];
  /** Conference, with its full name. */
  readonly venue: string | null;
  /** The institution that organised the conference. */
  readonly organizer: string | null;
  readonly date: string | null;
  /**
   * The conference certificate. This is a participation / presentation
   * certificate — NOT the paper, and not evidence of publication or indexing.
   */
  readonly certificate: CaptionedAsset | null;
  /** The paper itself — the supplied conference PDF. */
  readonly paper: AssetRef;
  /** An export of the paper's own first page, used as the preview. */
  readonly cover: AssetRef;
  readonly proof: readonly ExternalProof[];
}

export const research: readonly ResearchEntry[] = [
  {
    id: "ai-ml-smart-production",
    index: "01",
    title: "Artificial Intelligence and Machine Learning in Smart Production",
    subtitle: "Progress, Trends, and Future Directions",
    author: "Tamil R",
    institution: "PGP College of Engineering and Technology",
    domain: "Artificial Intelligence & Machine Learning",
    topics: [
      "AI",
      "Machine Learning",
      "Smart Production",
      "Industry 4.0",
      "Sustainability",
      "Bibliometric Analysis",
    ],
    description:
      "Presented research examining the evolution of Artificial Intelligence and Machine Learning in smart production, with a focus on Industry 4.0, sustainability, research trends, and future directions.",
    sources: ["Scopus", "Web of Science"],
    methods: [
      "Bibliometric analysis",
      "Content analysis",
      "Social network analysis",
      "Literature classification",
    ],
    venue:
      "ICRIET-2026 — International Conference on Recent Innovation in Engineering and Technology",
    organizer:
      "Sir Issac Newton College of Engineering and Technology (SINCET)",
    date: "27 March 2026",
    certificate: achievementAsset(
      "research-icriet-2026.jpg",
      "Conference certificate",
      "ICRIET-2026 certificate for Tamil R, for the paper Artificial Intelligence and Machine Learning in Smart Production: Progress, Trends, and Future Directions, held 27 March and organised by Sir Issac Newton College of Engineering and Technology",
      true,
    ),
    paper: assets.research.paper,
    cover: assets.research.cover,
    proof: [
      {
        id: "linkedin-post",
        label: "View on LinkedIn",
        href: "https://lnkd.in/p/gUU-75NU",
      },
    ],
  },
];

/**
 * What the section actually renders: active entries only, and then only the
 * groups that still have one.
 *
 * The portfolio here is curated, not exhaustive. Entries whose certificate has
 * not been supplied stay declared above — the architecture, the copy and the
 * asset slot are all ready — but they are filtered out rather than rendered as
 * empty rows. Setting `active: true` on an entry is all it takes to show it.
 */
export const populatedAchievementGroups: readonly AchievementGroup[] =
  achievementGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.active),
    }))
    .filter((group) => group.items.length > 0);

/** The certificate image for an entry, only once its file is supplied. */
export const readyCertificate = (
  entry: AchievementEntry,
): CaptionedAsset | null =>
  entry.certificate && entry.certificate.ready ? entry.certificate : null;

export const totalAchievementCount: number = achievementGroups.reduce(
  (sum, group) => sum + group.items.length,
  0,
);
