import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { isAdmin, isSuperAdmin, hasRole, type Role } from "@/lib/roles";
import { __setAuthFlag } from "@/hooks/useEventLogger";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const hydrate = useAuthStore((s) => s.hydrate);
  const clearError = useAuthStore((s) => s.clearError);

  // Sync the event logger's module flag with the auth state.
  useEffect(() => {
    __setAuthFlag(status === "authenticated");
  }, [status]);

  const role: Role | null = user?.role ?? null;

  return {
    user,
    role,
    status,
    error,
    isAuthenticated: status === "authenticated",
    isAdmin: isAdmin(role),
    isSuperAdmin: isSuperAdmin(role),
    hasRole: (required: Role) => hasRole(role, required),
    login,
    register,
    logout,
    hydrate,
    clearError,
  };
}