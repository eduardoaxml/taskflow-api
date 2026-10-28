import { useEffect, useState, type FormEvent } from "react";
import type { TaskComment } from "../types/api";
import { createTaskComment, getTaskComments } from "../services/commentService";

type Props = {
  organizationId: string;
  projectId: string;
  taskId: string;
  request: <T>(path: string, options?: RequestInit) => Promise<T>;
};

export default function TaskComments({
  organizationId,
  projectId,
  taskId,
  request,
}: Props) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    let cancelled = false;

    async function fetchComments() {
      try {
        const data = await getTaskComments(
          organizationId,
          projectId,
          taskId,
          request,
        );

        if (!cancelled) {
          setError("");
          setComments(data);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load comments.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchComments();

    return () => {
      cancelled = true;
    };
  }, [organizationId, projectId, taskId, request]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      setError("");
      const comment = await createTaskComment(
        organizationId,
        projectId,
        taskId,
        content.trim(),
        request,
      );
      setComments((previous) => [...previous, comment]);
      setContent("");
    } catch {
      setError("Unable to post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="task-comments">
      <h4>Comments ({comments.length})</h4>

      {loading ? (
        <p>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p>No comments yet.</p>
      ) : (
        <ul className="task-comments__list">
          {comments.map((comment) => (
            <li key={comment.id} className="task-comments__item">
              <strong>{comment.author_email}</strong>
              <p>{comment.content}</p>
              <small>{new Date(comment.created_at).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}

      {error && <p role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>
          Add a comment
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={5000}
            required
            rows={3}
          />
        </label>
        <button type="submit" disabled={submitting || !content.trim()}>
          {submitting ? "Posting..." : "Post comment"}
        </button>
      </form>
    </section>
  );
}
