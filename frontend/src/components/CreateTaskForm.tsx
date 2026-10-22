import { useState, type FormEvent } from "react";
import type { CreateTaskPayload, TaskPriority, TaskStatus } from "../types/api";
import { createTask } from "../services/taskService";

type AuthenticatedRequest = <T>(
  path: string,
  options?: RequestInit,
) => Promise<T>;

interface CreateTaskFormProps {
  organizationId: string;
  projectId: string;
  request: AuthenticatedRequest;
  onCreated: () => void;
}

export default function CreateTaskForm({
  organizationId,
  projectId,
  request,
  onCreated,
}: CreateTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const payload: CreateTaskPayload = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      due_date: dueDate || null,
    };

    try {
      await createTask(organizationId, projectId, payload, request);

      setTitle("");
      setDescription("");
      setStatus("TODO");
      setPriority("MEDIUM");
      setDueDate("");

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create task.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h3>Create a task</h3>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <label htmlFor="task-title">Title</label>
      <input
        id="task-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={200}
        required
        placeholder="e.g. Implement authentication"
      />

      <label htmlFor="task-description">Description</label>
      <textarea
        id="task-description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
        placeholder="Describe what needs to be done"
      />

      <div className="task-form-row">
        <div>
          <label htmlFor="task-status">Status</label>
          <select
            id="task-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as TaskStatus)}
          >
            <option value="TODO">To do</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <div>
          <label htmlFor="task-priority">Priority</label>
          <select
            id="task-priority"
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as TaskPriority)
            }
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      <label htmlFor="task-due-date">Due date</label>
      <input
        id="task-due-date"
        type="date"
        value={dueDate}
        onChange={(event) => setDueDate(event.target.value)}
      />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create task"}
      </button>
    </form>
  );
}
