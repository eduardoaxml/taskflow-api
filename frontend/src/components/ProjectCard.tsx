import { Link } from "react-router";

import type { Project } from "../types/api";
import ProjectStatusBadge from "./ProjectStatusBadge";

interface ProjectCardProps {
  project: Project;
  organizationId: string;
}

export default function ProjectCard({
  project,
  organizationId,
}: ProjectCardProps) {
  return (
    <li className="organization-project-card">
      <div className="organization-project-card__top">
        <div>
          <h3>
            <Link
              className="organization-project-card__title-link"
              to={`/organizations/${organizationId}/projects/${project.id}`}
            >
              {project.name}
            </Link>
          </h3>

          <p className="organization-project-card__slug">{project.slug}</p>
        </div>

        <ProjectStatusBadge status={project.status} />
      </div>

      <p className="organization-project-card__description">
        {project.description || "No description provided."}
      </p>

      <div className="organization-project-card__footer">
        <Link
          className="organization-project-card__link"
          to={`/organizations/${organizationId}/projects/${project.id}`}
        >
          View project →
        </Link>
      </div>
    </li>
  );
}
