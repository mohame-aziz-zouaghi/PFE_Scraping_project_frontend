import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { FullPageSpinner } from "@/components/ui/Spinner";

export default function AdminRoute() {
  const { status, isAdmin } = useAuth();
  if (status === "idle" || status === "loading") return <FullPageSpinner />;
  if (status !== "authenticated") return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/403" replace />;
  return <Outlet />;
}