import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/apiClient";
import { getProjects, type ProjectOrdering } from "../services/projectService";
import CreateProjectForm from "../components/CreateProjectForm";
import type { Project, ProjectStatus } from "../types/api";
import ProjectCard from "../components/ProjectCard";
import OrganizationMembers from "../components/OrganizationMembers";
import ProjectCardSkeleton from "../components/ProjectCardSkeleton";
import DashboardLayout from "../components/layout/DashboardLayout";
import "./OrganizationPage.css";

export default function OrganizationPage() {
  const { organizationId } = useParams();
  const { request } = useAuth();
  const requestIdRef = useRef(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ProjectStatus>(
    "ALL",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  type ProjectSortOption = ProjectOrdering;

  const [sortBy, setSortBy] = useState<ProjectSortOption>("-created_at");

  const loadProjects = useCallback(
    async (page = 1) => {
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
        const data = await getProjects(organizationId, request, page, {
          search: debouncedSearch,
          status: statusFilter,
          ordering: sortBy,
        });

        if (requestId === requestIdRef.current) {
          setProjects(data.results);
          setTotalProjects(data.count);
          setHasNextPage(data.next !== null);
          setHasPreviousPage(data.previous !== null);
          setCurrentPage(page);
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
    },
    [organizationId, request, debouncedSearch, statusFilter, sortBy],
  );

  useEffect(() => {
    if (!organizationId) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProjects(1);

    return () => {
      requestIdRef.current += 1;
    };
  }, [organizationId, loadProjects]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  const filteredProjects = projects.filter((project) => {
    const matchesStatus =
      statusFilter === "ALL" || project.status === statusFilter;

    const normalizedSearch = searchTerm.trim().toLowerCase();

    const matchesSearch =
      project.name.toLowerCase().includes(normalizedSearch) ||
      project.slug.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);

      case "-name":
        return b.name.localeCompare(a.name);

      case "created_at":
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

      case "status":
        return a.status.localeCompare(b.status);

      case "-created_at":
      default:
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  });
  return (
    <DashboardLayout
      activeSection="organizations"
      organizationsTo={`/organizations/${organizationId}`}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Search projects by name or slug..."
    >
      <div className="organization-page">
        <section className="organization-page__header">
          <div>
            <p className="eyebrow">ORGANIZATION WORKSPACE</p>
            <h1>Organization Projects</h1>
            <p className="organization-page__description">
              Manage your projects, team members, and organization workspace.
            </p>
          </div>

          <Link className="secondary-button" to="/dashboard">
            ← Back to dashboard
          </Link>
        </section>

        {isLoading && (
          <section
            className="project-list project-list--loading"
            aria-label="Loading projects"
            aria-busy="true"
          >
            {Array.from({ length: 3 }, (_, index) => (
              <ProjectCardSkeleton key={index} />
            ))}
          </section>
        )}

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
        <div className="organization-page__overview">
          <section className="organization-page__create">
            {organizationId && (
              <CreateProjectForm
                organizationId={organizationId}
                request={request}
                onCreated={() => void loadProjects()}
              />
            )}
          </section>
          <section className="organization-page__team">
            {organizationId && (
              <OrganizationMembers
                organizationId={organizationId}
                request={request}
              />
            )}
          </section>
        </div>
      </div>
      <section className="organization-page__listing">
        <div className="organization-page__toolbar">
          <div className="organization-page__field">
            <label htmlFor="project-status-filter">Filter by status</label>

            <select
              id="project-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ProjectStatus | "ALL")
              }
            >
              <option value="ALL">All projects</option>
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div className="organization-page__field">
            <label htmlFor="project-sort">Sort by</label>

            <select
              id="project-sort"
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as ProjectSortOption)
              }
            >
              <option value="-created_at">Newest first</option>
              <option value="created_at">Oldest first</option>
              <option value="name">Name (A–Z)</option>
              <option value="-name">Name (Z–A)</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </section>
      {!isLoading && !error && projects.length > 0 && (
        <section>
          <h2>Projects</h2>
          <ul className="organization-page__project-grid">
            {sortedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                organizationId={organizationId!}
              />
            ))}
          </ul>
          {filteredProjects.length === 0 && (
            <p>
              {searchTerm.trim() || statusFilter !== "ALL"
                ? "No projects match your search or selected filter."
                : "No projects found."}
            </p>
          )}
        </section>
      )}
      {!isLoading && !error && totalProjects > 0 && (
        <nav aria-label="Project pagination" className="project-pagination">
          <button
            type="button"
            disabled={!hasPreviousPage}
            onClick={() => void loadProjects(currentPage - 1)}
          >
            Previous
          </button>

          <span>
            Page {currentPage} · {totalProjects} projects
          </span>

          <button
            type="button"
            disabled={!hasNextPage}
            onClick={() => void loadProjects(currentPage + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </DashboardLayout>
  );
}
