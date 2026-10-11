import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { FullPageSpinner } from "@/components/ui/Spinner";

export default function SuperAdminRoute() {
  const { status, isSuperAdmin } = useAuth();
  if (status === "idle" || status === "loading") return <FullPageSpinner />;
  if (status !== "authenticated") return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/403" replace />;
  return <Outlet />;
}