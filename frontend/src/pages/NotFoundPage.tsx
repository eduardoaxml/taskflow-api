import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>The page you requested doesn't exist.</p>
      <Link to="/">Return home</Link>
    </main>
  );
}
