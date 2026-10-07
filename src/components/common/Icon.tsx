import {
  FiActivity,
  FiArrowRight,
  FiArrowUpRight,
  FiBarChart2,
  FiChevronLeft,
  FiChevronRight,
  FiCode,
  FiDatabase,
  FiFileText,
  FiGithub,
  FiGrid,
  FiLayers,
  FiLayout,
  FiLinkedin,
  FiMail,
  FiMapPin,
} from "react-icons/fi";
import { LuBrain, LuSparkles } from "react-icons/lu";
import type { IconKey } from "../../data";

/**
 * ICON REGISTRY
 * Data files reference icons by string key, which keeps `src/data/` free of
 * React imports and means swapping an icon set is a one-file change.
 */
const registry: Record<IconKey, React.ComponentType<{ "aria-hidden"?: boolean }>> =
  {
    mail: FiMail,
    github: FiGithub,
    linkedin: FiLinkedin,
    resume: FiFileText,
    location: FiMapPin,
    "arrow-right": FiArrowRight,
    "arrow-up-right": FiArrowUpRight,
    "chevron-right": FiChevronRight,
    "chevron-left": FiChevronLeft,
    brain: LuBrain,
    sparkles: LuSparkles,
    chart: FiBarChart2,
    /* Tabular data — the Pandas / NumPy half of the stack, not a database. */
    grid: FiGrid,
    /* The relational store — MySQL — as distinct from the tabular grid above. */
    database: FiDatabase,
    /* Real-time: a live signal trace rather than a second sparkle. */
    signal: FiActivity,
    /* Web: the interface a model is served through. */
    layout: FiLayout,
    app: FiLayers,
    code: FiCode,
  };

export interface IconProps {
  name: IconKey;
  className?: string;
}

export function Icon({ name, className }: IconProps) {
  const Component = registry[name];
  if (!Component) return null;
  return (
    <span className={className} aria-hidden="true">
      <Component aria-hidden />
    </span>
  );
}
