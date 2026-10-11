import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex items-center justify-center py-20 text-text-muted">
        Loading…
      </div>
    );
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}