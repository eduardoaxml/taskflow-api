export default function ProjectCardSkeleton() {
  return (
    <article className="project-card project-card--skeleton" aria-hidden="true">
      <div className="skeleton skeleton--title" />
      <div className="skeleton skeleton--description" />
      <div className="skeleton skeleton--description skeleton--short" />
      <div className="skeleton skeleton--status" />
    </article>
  );
}
