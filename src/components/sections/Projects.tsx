import { useState } from "react";
import { projects } from "../../data";
import { SectionShell } from "../common/SectionShell";
import { ProjectRow } from "./ProjectRow";

/**
 * PROJECTS
 * ========
 * A numbered editorial ledger. One row open at a time, which keeps the
 * section scannable at a glance and means the page never grows by four detail
 * panels at once.
 *
 * Order comes straight from `src/data/projects.ts` — the data file is the
 * ledger, this component only renders it.
 */
export function Projects() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <SectionShell
      id="projects"
      ghost="Create"
      lede={
        <p>
          Selected work — four self-driven builds, from end-to-end machine
          learning applications to real-time generative AI. Open a row for the
          detail.
        </p>
      }
    >
      <div className="projects__ledger">
        {projects.map((project) => (
          <ProjectRow
            key={project.id}
            project={project}
            open={openId === project.id}
            onToggle={() =>
              setOpenId((current) =>
                current === project.id ? null : project.id,
              )
            }
          />
        ))}
      </div>
    </SectionShell>
  );
}
