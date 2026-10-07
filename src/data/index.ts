/**
 * DATA BARREL
 * Components import from here, never from individual files, so content can be
 * reorganised without touching the UI.
 */

export { personal, socials, getSocial, mailtoHref } from "./personal";
export type { SocialLink, Language, IconKey } from "./personal";

export {
  skillGroups,
  populatedSkillGroups,
  technicalSkillGroups,
  softSkills,
  technicalSkillCount,
  totalSkillCount,
  verifySkillUniqueness,
} from "./skills";
export type {
  Skill,
  SkillGroup,
  NumberedSkillGroup,
  SkillCategoryId,
} from "./skills";

export {
  orbitTechnologies,
  orbitSubset,
  verifyOrbitTechnologies,
} from "./technologies";
export type {
  OrbitTechnology,
  TechIconKey,
  TechCategory,
  OrbitLayerId,
} from "./technologies";

export { services } from "./services";
export type { Service } from "./services";

export {
  projects,
  featuredProjects,
  getProject,
  readyScreenshots,
  hasProjectDetail,
} from "./projects";
export type { Project, ProjectMetric, ProjectStatus } from "./projects";

export {
  experience,
  formatPeriod,
  readyExperienceMedia,
} from "./experience";
export type { ExperienceEntry } from "./experience";

export {
  education,
  renderableEducation,
  educationTitle,
  formatEducationPeriod,
} from "./education";
export type { EducationEntry, EducationScore } from "./education";

export {
  achievementGroups,
  populatedAchievementGroups,
  readyCertificate,
  research,
  totalAchievementCount,
} from "./achievements";
export type {
  AchievementEntry,
  AchievementGroup,
  AchievementGroupId,
  ExternalProof,
  RelatedRef,
  ResearchEntry,
} from "./achievements";
