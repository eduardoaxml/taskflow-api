import { Link } from "react-router";
import "./HomePage.css";

const features = [
  {
    number: "01",
    title: "Organize your work",
    description:
      "Keep projects, tasks, and team responsibilities organized in one workspace.",
    icon: "▦",
  },
  {
    number: "02",
    title: "Collaborate with your team",
    description:
      "Assign tasks, share comments, and keep everyone aligned as work progresses.",
    icon: "◎",
  },
  {
    number: "03",
    title: "Track every detail",
    description:
      "Follow task statuses, review activity, and understand what needs attention.",
    icon: "↗",
  },
];

const workflow = [
  { label: "Design homepage", status: "In progress", type: "progress" },
  { label: "Build authentication", status: "Completed", type: "done" },
  { label: "Review API endpoints", status: "To do", type: "todo" },
];

export default function HomePage() {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link to="/" className="landing-brand" aria-label="TaskFlow home">
          <span className="brand-mark">T</span>
          <span>
            taskflow<span className="brand-period">.</span>
          </span>
        </Link>

        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
        </div>

        <div className="landing-nav-actions">
          <Link to="/login" className="nav-login">
            Log in
          </Link>
          <Link to="/register" className="button button-dark nav-cta">
            Get started <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            YOUR WORK, IN SYNC
          </div>

          <h1>
            Make progress.
            <br />
            <span>Not just plans.</span>
          </h1>

          <p className="hero-description">
            Bring your projects, tasks, and team together in one clear
            workspace. Spend less time managing work and more time getting it
            done.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="button button-dark button-large">
              Start for free <span aria-hidden="true">→</span>
            </Link>
            <a href="#features" className="button button-light button-large">
              Explore features
            </a>
          </div>

          <div className="hero-note">
            <span className="note-check">✓</span>A clearer way to work, from day
            one.
          </div>
        </div>

        <div className="hero-visual" aria-label="TaskFlow product preview">
          <div className="visual-glow" />
          <div className="app-preview">
            <aside className="preview-sidebar">
              <div className="preview-logo">
                <span className="brand-mark preview-brand-mark">T</span>
                <strong>taskflow</strong>
              </div>

              <div className="preview-nav-label">WORKSPACE</div>
              <div className="preview-nav-item active">
                <span>▦</span> Overview
              </div>
              <div className="preview-nav-item">
                <span>◫</span> Projects
              </div>
              <div className="preview-nav-item">
                <span>✓</span> My tasks
              </div>

              <div className="preview-sidebar-bottom">
                <span className="avatar avatar-purple">JD</span>
                <div>
                  <strong>Jamie Davis</strong>
                  <small>Team member</small>
                </div>
              </div>
            </aside>

            <div className="preview-main">
              <div className="preview-topline">
                <span>Workspace / Overview</span>
                <span className="preview-live">
                  <span /> Live workspace
                </span>
              </div>

              <div className="preview-heading">
                <div>
                  <h2>Good morning, Jamie</h2>
                  <p>Here's what's happening with your projects.</p>
                </div>
                <span className="preview-date">This week</span>
              </div>

              <div className="preview-stats">
                <div className="preview-stat">
                  <span>Active projects</span>
                  <strong>04</strong>
                  <small>Across your workspace</small>
                </div>
                <div className="preview-stat">
                  <span>Tasks to do</span>
                  <strong>12</strong>
                  <small>Ready for your attention</small>
                </div>
              </div>

              <div className="preview-tasks-heading">
                <strong>Project tasks</strong>
                <span>View all ↗</span>
              </div>

              <div className="preview-task-list">
                {workflow.map((task) => (
                  <div className="preview-task" key={task.label}>
                    <span className={`task-indicator ${task.type}`}>
                      {task.type === "done" ? "✓" : ""}
                    </span>
                    <span className="preview-task-name">{task.label}</span>
                    <span className={`task-status ${task.type}`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="preview-footer">
                <span className="avatar avatar-blue">AL</span>
                <span className="avatar avatar-orange">MK</span>
                <span className="avatar avatar-green">SR</span>
                <span className="preview-team-label">
                  Your team, moving forward.
                </span>
              </div>
            </div>
          </div>

          <div className="floating-card floating-card-top">
            <span className="floating-icon">✓</span>
            <div>
              <strong>Task completed</strong>
              <small>One step closer to done.</small>
            </div>
          </div>

          <div className="floating-card floating-card-bottom">
            <span className="floating-progress">↗</span>
            <div>
              <strong>Work in progress</strong>
              <small>Everything in one place.</small>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-trust">
        <p>LESS CHAOS. MORE CLARITY.</p>
        <div>
          <span>Projects</span>
          <span className="trust-divider">/</span>
          <span>Tasks</span>
          <span className="trust-divider">/</span>
          <span>Teamwork</span>
          <span className="trust-divider">/</span>
          <span>Progress</span>
        </div>
      </section>

      <section className="landing-features" id="features">
        <div className="section-heading">
          <span className="section-eyebrow">BUILT FOR GETTING THINGS DONE</span>
          <h2>
            Everything in sync.
            <br />
            <span>Nothing overlooked.</span>
          </h2>
          <p>
            A simple, focused workspace that helps your team turn ideas into
            completed work.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <div className="feature-card-top">
                <span className="feature-icon">{feature.icon}</span>
                <span className="feature-number">{feature.number}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <a href="#how-it-works" className="feature-link">
                Learn more <span aria-hidden="true">→</span>
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-bottom-cta" id="how-it-works">
        <div>
          <span className="section-eyebrow">READY WHEN YOU ARE</span>
          <h2>Make your next project your best one.</h2>
          <p>
            Get your workspace organized and give your team a clearer path
            forward.
          </p>
        </div>
        <Link to="/register" className="button button-white button-large">
          Create your account <span aria-hidden="true">→</span>
        </Link>
      </section>

      <footer className="landing-footer">
        <Link to="/" className="landing-brand footer-brand">
          <span className="brand-mark">T</span>
          <span>
            taskflow<span className="brand-period">.</span>
          </span>
        </Link>
        <p>Less busywork. More meaningful progress.</p>
        <span>© {new Date().getFullYear()} TaskFlow</span>
      </footer>
    </main>
  );
}
