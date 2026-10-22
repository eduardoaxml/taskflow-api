import { useEffect, useState, type FormEvent } from "react";
import type {
  CreateTaskPayload,
  Task,
  TaskPriority,
  TaskStatus,
} from "../types/api";
import { updateTask } from "../services/taskService";
import type { OrganizationMember } from "../types/api";
import { getOrganizationMembers } from "../services/memberService";

type AuthenticatedRequest = <T>(
  path: string,
  options?: RequestInit,
) => Promise<T>;

interface EditTaskFormProps {
  organizationId: string;
  projectId: string;
  task: Task;
  request: AuthenticatedRequest;
  onSaved: () => void;
  onCancel: () => void;
}

export default function EditTaskForm({
  organizationId,
  projectId,
  task,
  request,
  onSaved,
  onCancel,
}: EditTaskFormProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [membersError, setMembersError] = useState("");
  const [assigneeId, setAssigneeId] = useState(
    task.assignee == null ? "" : String(task.assignee),
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    const payload: CreateTaskPayload = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      due_date: dueDate || null,
      assignee: assigneeId ? Number(assigneeId) : null,
    };

    setIsSaving(true);

    try {
      await updateTask(organizationId, projectId, task.id, payload, request);

      onSaved();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update task. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }
  useEffect(() => {
    let isMounted = true;

    async function loadMembers() {
      try {
        const response = await getOrganizationMembers(organizationId, request);

        if (isMounted) {
          setMembers(response.results.filter((member) => member.is_active));
        }
      } catch {
        if (isMounted) {
          setMembersError("Unable to load organization members.");
        }
      }
    }

    void loadMembers();

    return () => {
      isMounted = false;
    };
  }, [organizationId, request]);
  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h5>Edit task</h5>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="edit-task-assignee">Assign to</label>

        <select
          id="edit-task-assignee"
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.target.value)}
        >
          <option value="">Unassigned</option>

          {members.map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.user_email}
            </option>
          ))}
        </select>

        {membersError && <p role="alert">{membersError}</p>}
      </div>
      <label htmlFor={`edit-title-${task.id}`}>Title</label>
      <input
        id={`edit-title-${task.id}`}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={200}
        required
      />

      <label htmlFor={`edit-description-${task.id}`}>Description</label>
      <textarea
        id={`edit-description-${task.id}`}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
      />

      <div className="task-form-row">
        <div>
          <label htmlFor={`edit-status-${task.id}`}>Status</label>
          <select
            id={`edit-status-${task.id}`}
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
          <label htmlFor={`edit-priority-${task.id}`}>Priority</label>
          <select
            id={`edit-priority-${task.id}`}
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

      <label htmlFor={`edit-due-date-${task.id}`}>Due date</label>
      <input
        id={`edit-due-date-${task.id}`}
        type="date"
        value={dueDate}
        onChange={(event) => setDueDate(event.target.value)}
      />

      <div>
        <button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save changes"}
        </button>

        <button type="button" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
