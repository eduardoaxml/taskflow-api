import { useState, type FormEvent } from "react";
import { ApiError } from "../services/apiClient";
import {
  createProject,
  type CreateProjectPayload,
} from "../services/projectService";

interface Props {
  organizationId: string;
  onCreated: () => void;
  request: <T>(path: string, options?: RequestInit) => Promise<T>;
}

function createSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function CreateProjectForm({
  organizationId,
  onCreated,
  request,
}: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const payload: CreateProjectPayload = {
      name: name.trim(),
      slug: slug.trim(),
    };

    try {
      await createProject(organizationId, payload, request);

      setName("");
      setSlug("");
      setSlugEdited(false);
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          typeof err.data === "object" && err.data !== null
            ? JSON.stringify(err.data)
            : err.message,
        );
      } else {
        setError("Unable to create the project. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="create-project-form" onSubmit={handleSubmit}>
      <div className="create-project-form__header">
        <div>
          <p className="eyebrow">PROJECT MANAGEMENT</p>
          <h2>Create a project</h2>
          <p>Start organizing your work in a new project.</p>
        </div>

        <span className="create-project-form__icon" aria-hidden="true">
          +
        </span>
      </div>

      <div className="create-project-form__fields">
        <div className="create-project-form__field">
          <label htmlFor="project-name">Project name</label>
          <input
            id="project-name"
            value={name}
            onChange={(event) => {
              const nextName = event.target.value;
              setName(nextName);

              if (!slugEdited) {
                setSlug(createSlug(nextName));
              }
            }}
            required
            maxLength={150}
            placeholder="e.g. Website Redesign"
          />
          <span className="create-project-form__hint">
            Choose a descriptive name for your project.
          </span>
        </div>

        <div className="create-project-form__field">
          <label htmlFor="project-slug">Project slug</label>
          <input
            id="project-slug"
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value);
              setSlugEdited(true);
            }}
            required
            maxLength={150}
            pattern="[a-zA-Z0-9-]+"
            title="Use letters, numbers, and hyphens."
            placeholder="e.g. website-redesign"
          />
          <span className="create-project-form__hint">
            Used in project URLs. Only letters, numbers, and hyphens.
          </span>
        </div>
      </div>

      {error && (
        <p className="create-project-form__error" role="alert">
          {error}
        </p>
      )}

      <div className="create-project-form__footer">
        <button
          className="create-project-form__submit"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create project"}
          {!isSubmitting && <span aria-hidden="true"> →</span>}
        </button>
      </div>
    </form>
  );
}
