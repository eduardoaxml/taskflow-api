import { useEffect, useState } from "react";
import type { TaskActivity } from "../types/api";
import { getTaskActivities } from "../services/activityService";

type Props = {
  organizationId: string;
  projectId: string;
  taskId: string;
  request: <T>(path: string, options?: RequestInit) => Promise<T>;
};

export default function TaskActivityTimeline({
  organizationId,
  projectId,
  taskId,
  request,
}: Props) {
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadActivities() {
      try {
        const data = await getTaskActivities(
          organizationId,
          projectId,
          taskId,
          request,
        );

        if (active) setActivities(data);
      } catch {
        if (active) setError("Unable to load activity history.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadActivities();

    return () => {
      active = false;
    };
  }, [organizationId, projectId, taskId, request]);

  return (
    <section className="task-activity">
      <h4>Activity history</h4>

      {loading && <p>Loading activity...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && activities.length === 0 && (
        <p>No activity recorded yet.</p>
      )}

      <ul className="task-activity__list">
        {activities.map((activity) => (
          <li key={activity.id} className="task-activity__item">
            <strong>
              {activity.actor_email} — {activity.action.replaceAll("_", " ")}
            </strong>
            <p>{activity.description}</p>
            <small>{new Date(activity.created_at).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
