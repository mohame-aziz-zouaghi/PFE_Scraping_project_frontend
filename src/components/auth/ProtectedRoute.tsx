import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { FullPageSpinner } from "@/components/ui/Spinner";

export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "idle" || status === "loading") return <FullPageSpinner />;
  if (status !== "authenticated") {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <Outlet />;
}