import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/apiClient";
import { getProjects } from "../services/projectService";
import CreateProjectForm from "../components/CreateProjectForm";
import ProjectTasks from "../components/ProjectTasks";
import type { Project } from "../types/api";
import OrganizationMembers from "../components/OrganizationMembers";

export default function OrganizationPage() {
  const { organizationId } = useParams();
  const { request } = useAuth();
  const requestIdRef = useRef(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProjects = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!organizationId) {
      setProjects([]);
      setError("");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await getProjects(organizationId, request);

      if (requestId === requestIdRef.current) {
        setProjects(data.results);
      }
    } catch (error: unknown) {
      if (requestId === requestIdRef.current) {
        setError(
          error instanceof ApiError
            ? error.message
            : "Unable to load projects.",
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [organizationId, request]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProjects();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      requestIdRef.current += 1;
    };
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

      {organizationId && (
        <OrganizationMembers
          organizationId={organizationId}
          request={request}
        />
      )}

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
