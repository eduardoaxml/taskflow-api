import { useState, type FormEvent } from "react";
import { ApiError } from "../services/apiClient";
import { createOrganization } from "../services/organizationService";

interface Props {
  accessToken: string;
  onCreated: () => void;
}

function createSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function CreateOrganizationForm({
  accessToken,
  onCreated,
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

    try {
      await createOrganization(accessToken, {
        name: name.trim(),
        slug: slug.trim(),
      });

      setName("");
      setSlug("");
      setSlugEdited(false);
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) {
        const details =
          typeof err.data === "object" && err.data !== null
            ? JSON.stringify(err.data)
            : err.message;

        setError(details);
      } else {
        setError("Unable to create the organization. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create an organization</h2>

      <label htmlFor="organization-name">Organization name</label>
      <input
        id="organization-name"
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
        placeholder="e.g. Acme Studio"
      />

      <label htmlFor="organization-slug">Slug</label>
      <input
        id="organization-slug"
        value={slug}
        onChange={(event) => {
          setSlug(event.target.value);
          setSlugEdited(true);
        }}
        required
        maxLength={150}
        pattern="[a-zA-Z0-9-]+"
        title="Use letters, numbers, and hyphens."
        placeholder="e.g. acme-studio"
      />

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create organization"}
      </button>
    </form>
  );
}
