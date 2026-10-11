import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <h1 className="text-6xl font-bold text-text-primary">404</h1>
      <p className="text-text-muted mt-4">This page doesn't exist.</p>
      <Link
        to="/"
        className="inline-block mt-6 text-brand-600 hover:underline"
      >
        &larr; Back to home
      </Link>
    </div>
  );
}