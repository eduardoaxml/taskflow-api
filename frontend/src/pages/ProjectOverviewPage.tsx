import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getAllOrganizationMembers } from "../services/memberService";
import type { Project, OrganizationMember, TaskStatus } from "../types/api";
import { deleteProject } from "../services/projectService";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/apiClient";
import {
  getProject,
  updateProject,
  type UpdateProjectPayload,
} from "../services/projectService";
import ProjectStatusBadge from "../components/ProjectStatusBadge";
import ProjectTasks from "../components/ProjectTasks";
import "./ProjectOverviewPage.css";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProjectTaskSummary from "../components/ProjectTaskSummary";
import {
  getProjectTaskSummary,
  type ProjectTaskSummary as ProjectTaskSummaryData,
} from "../services/taskService";

export default function ProjectOverviewPage() {
  const navigate = useNavigate();
  const { organizationId, projectId } = useParams();
  const { request, user } = useAuth();
  const requestIdRef = useRef(0);
  const summaryRequestIdRef = useRef(0);
  const [currentMembership, setCurrentMembership] =
    useState<OrganizationMember | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [taskSummary, setTaskSummary] = useState<ProjectTaskSummaryData | null>(
    null,
  );
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatus | "ALL">(
    "ALL",
  );
  const [overdueFilter, setOverdueFilter] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLElement>(null);
  const [formData, setFormData] = useState<UpdateProjectPayload>({
    name: "",
    description: "",
    status: "PLANNING",
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadProject = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!organizationId || !projectId) {
      setProject(null);
      setError("Invalid project URL.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const selectedProject = await getProject(
        organizationId,
        projectId,
        request,
      );

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!selectedProject) {
        setProject(null);
        setError("Project not found or you don't have access to it.");
        return;
      }

      setProject(selectedProject);
      setFormData({
        name: selectedProject.name,
        description: selectedProject.description ?? "",
        status: selectedProject.status,
      });
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to load project details.",
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [organizationId, projectId, request]);

  const handleDeleteProject = async () => {
    if (!organizationId || !projectId || isDeleting) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${project?.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteProject(organizationId, projectId, request);
      await navigate(`/organizations/${organizationId}`);
    } catch (error: unknown) {
      setDeleteError(
        error instanceof ApiError ? error.message : "Unable to delete project.",
      );
    } finally {
      setIsDeleting(false);
    }
  };
  const handleUpdateProject = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!organizationId || !projectId) {
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      const updatedProject = await updateProject(
        organizationId,
        projectId,
        formData,
        request,
      );

      setProject(updatedProject);
      setFormData({
        name: updatedProject.name,
        description: updatedProject.description ?? "",
        status: updatedProject.status,
      });

      setIsEditing(false);
    } catch (error: unknown) {
      setFormError(
        error instanceof ApiError ? error.message : "Unable to update project.",
      );
    } finally {
      setIsSaving(false);
    }
  };
  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const modal = modalRef.current;

    if (!modal) {
      return;
    }

    const focusableSelector = [
      "button:not(:disabled)",
      "input:not(:disabled)",
      "textarea:not(:disabled)",
      "select:not(:disabled)",
      "a[href]",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    const getFocusableElements = () =>
      Array.from(modal.querySelectorAll<HTMLElement>(focusableSelector));

    getFocusableElements()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!isSaving) {
          setIsEditing(false);
          setFormError("");
        }

        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      editButtonRef.current?.focus();
    };
  }, [isEditing, isSaving]);
  useEffect(() => {
    let active = true;

    async function loadMembership() {
      if (!organizationId || !user) {
        setCurrentMembership(null);
        return;
      }

      try {
        const members = await getAllOrganizationMembers(
          organizationId,
          request,
        );

        if (!active) return;

        const membership = members.find(
          (member) =>
            String(member.user_id) === String(user.id) && member.is_active,
        );

        setCurrentMembership(membership ?? null);
      } catch {
        if (active) {
          setCurrentMembership(null);
        }
      }
    }

    void loadMembership();

    return () => {
      active = false;
    };
  }, [organizationId, request, user]);

  const canManageProject =
    currentMembership?.role === "OWNER" || currentMembership?.role === "ADMIN";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProject();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      requestIdRef.current += 1;
    };
  }, [loadProject]);

  const refreshTaskSummary = useCallback(async () => {
    if (!organizationId || !projectId) {
      setTaskSummary(null);
      setIsSummaryLoading(false);
      return;
    }

    const requestId = ++summaryRequestIdRef.current;

    setIsSummaryLoading(true);
    setSummaryError("");

    try {
      const summary = await getProjectTaskSummary(
        organizationId,
        projectId,
        request,
      );

      if (requestId === summaryRequestIdRef.current) {
        setTaskSummary(summary);
      }
    } catch (error: unknown) {
      if (requestId === summaryRequestIdRef.current) {
        setTaskSummary(null);
        setSummaryError(
          error instanceof ApiError
            ? error.message
            : "Unable to load project task metrics.",
        );
      }
    } finally {
      if (requestId === summaryRequestIdRef.current) {
        setIsSummaryLoading(false);
      }
    }
  }, [organizationId, projectId, request]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshTaskSummary();

    return () => {
      summaryRequestIdRef.current += 1;
    };
  }, [refreshTaskSummary]);

  if (isLoading) {
    return (
      <DashboardLayout
        activeSection="organizations"
        organizationsTo={`/organizations/${organizationId}`}
      >
        <div className="project-overview-page">
          <p>Loading project...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout
        activeSection="organizations"
        organizationsTo={`/organizations/${organizationId}`}
      >
        <div className="project-overview-page">
          <Link to={`/organizations/${organizationId}`}>
            ← Back to organization
          </Link>

          <div className="project-overview-error" role="alert">
            <h1>Unable to open project</h1>
            <p>{error || "Project not found."}</p>

            <button type="button" onClick={() => void loadProject()}>
              Try again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeSection="organizations"
      organizationsTo={`/organizations/${organizationId}`}
    >
      <div className="project-overview-page">
        <header className="project-overview-header">
          <nav aria-label="Breadcrumb">
            <Link to="/dashboard">Dashboard</Link>
            <span>/</span>
            <Link to={`/organizations/${organizationId}`}>Organization</Link>
            <span>/</span>
            <span>{project.name}</span>
          </nav>

          <div className="project-overview-title">
            <div>
              <p className="project-overview-eyebrow">PROJECT OVERVIEW</p>
              <h1>{project.name}</h1>
              <p>{project.description || "No description provided."}</p>
            </div>
            {deleteError && <p role="alert">{deleteError}</p>}
            <span
              className={`project-status project-status--${project.status.toLowerCase()}`}
            >
              {project.status.replace("_", " ")}
            </span>
            {canManageProject && (
              <button
                ref={editButtonRef}
                type="button"
                onClick={() => {
                  setFormError("");
                  setIsEditing(true);
                }}
              >
                Edit project
              </button>
            )}
            {canManageProject && (
              <button
                type="button"
                onClick={() => void handleDeleteProject()}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Project"}
              </button>
            )}
          </div>
        </header>
        {isEditing && (
          <div
            className="project-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isSaving) {
                setIsEditing(false);
                setFormError("");
              }
            }}
          >
            <section
              ref={modalRef}
              className="project-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-modal-title"
            >
              <header className="project-modal-header">
                <div>
                  <p className="project-overview-eyebrow">PROJECT SETTINGS</p>
                  <h2 id="project-modal-title">Edit project</h2>
                </div>

                <button
                  type="button"
                  className="project-modal-close"
                  aria-label="Close modal"
                  disabled={isSaving}
                  onClick={() => {
                    setIsEditing(false);
                    setFormError("");
                  }}
                >
                  &times;
                </button>
              </header>

              <form onSubmit={handleUpdateProject}>
                <div className="project-modal-body">
                  <div className="project-form-field">
                    <label htmlFor="project-name">Project name</label>
                    <input
                      id="project-name"
                      type="text"
                      value={formData.name}
                      maxLength={200}
                      required
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          name: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="project-form-field">
                    <label htmlFor="project-description">Description</label>
                    <textarea
                      id="project-description"
                      value={formData.description}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          description: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="project-form-field">
                    <label htmlFor="project-status">Status</label>
                    <select
                      id="project-status"
                      value={formData.status}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          status: event.target
                            .value as UpdateProjectPayload["status"],
                        }))
                      }
                    >
                      <option value="PLANNING">Planning</option>
                      <option value="ACTIVE">Active</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>

                  {formError && (
                    <p role="alert" className="project-edit-error">
                      {formError}
                    </p>
                  )}
                </div>

                <footer className="project-modal-footer">
                  <button
                    type="button"
                    className="project-modal-cancel"
                    disabled={isSaving}
                    onClick={() => {
                      setFormData({
                        name: project.name,
                        description: project.description ?? "",
                        status: project.status,
                      });
                      setFormError("");
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="project-modal-save"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>
                </footer>
              </form>
            </section>
          </div>
        )}
        <section className="project-overview-details">
          <article className="project-detail-card">
            <span>Project name</span>
            <strong>{project.name}</strong>
          </article>

          <article className="project-detail-card">
            <span>Slug</span>
            <strong>{project.slug}</strong>
          </article>

          <article className="project-detail-card">
            <span>Status</span>
            <ProjectStatusBadge status={project.status} />
          </article>
        </section>

        <section className="project-overview-tasks">
          {isSummaryLoading && (
            <p className="project-task-summary__message">
              Loading task metrics...
            </p>
          )}

          {summaryError && (
            <p
              className="project-task-summary__message project-task-summary__message--error"
              role="alert"
            >
              {summaryError}
            </p>
          )}

          {!isSummaryLoading && !summaryError && taskSummary && (
            <ProjectTaskSummary
              summary={taskSummary}
              onSelectStatus={setTaskStatusFilter}
              isOverdueSelected={overdueFilter}
              onSelectOverdue={() => setOverdueFilter((current) => !current)}
            />
          )}
          <div className="project-section-heading">
            <div>
              <p className="project-overview-eyebrow">WORK MANAGEMENT</p>
              <h2>Project tasks</h2>
              <p>Manage and track the work assigned to this project.</p>
            </div>
          </div>

          <ProjectTasks
            organizationId={organizationId!}
            projectId={project.id}
            request={request}
            statusFilter={taskStatusFilter}
            onStatusFilterChange={setTaskStatusFilter}
            overdueFilter={overdueFilter}
            onOverdueFilterChange={setOverdueFilter}
            onTasksChanged={refreshTaskSummary}
          />
        </section>
      </div>
    </DashboardLayout>
  );
}
