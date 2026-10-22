import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { ApiError } from "../services/apiClient";
import { getProjects } from "../services/projectService";
import CreateProjectForm from "../components/CreateProjectForm";
import ProjectTasks from "../components/ProjectTasks";
import type { Project } from "../types/api";

export default function OrganizationPage() {
  const { organizationId } = useParams();
  const { request } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProjects = useCallback(async () => {
    if (!organizationId) {
      setError("Organization ID is missing.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await getProjects(organizationId, request);
      setProjects(response.results);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to load projects. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, request]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  return (
    <main>
      <header>
        <Link to="/dashboard">← Dashboard</Link>
        <h1>Organization Projects</h1>
      </header>

      {isLoading && <p>Loading projects...</p>}

      {error && (
        <div role="alert">
          <p>{error}</p>
          <button onClick={() => void loadProjects()}>Retry</button>
        </div>
      )}

      {!isLoading && !error && projects.length === 0 && (
        <section>
          <h2>No projects yet</h2>
          <p>
            This organization doesn't have any projects yet. We'll add project
            creation next.
          </p>
        </section>
      )}

      <section>
        {organizationId && (
          <CreateProjectForm
            organizationId={organizationId}
            request={request}
            onCreated={() => void loadProjects()}
          />
        )}
      </section>

      {!isLoading && !error && projects.length > 0 && (
        <section>
          <h2>Projects</h2>
          <ul>
            {projects.map((project) => (
              <li key={project.id}>
                <h3>{project.name}</h3>

                <p>{project.description || "No description provided."}</p>

                <p>Status: {project.status}</p>

                {organizationId && (
                  <ProjectTasks
                    organizationId={organizationId}
                    projectId={project.id}
                    request={request}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
