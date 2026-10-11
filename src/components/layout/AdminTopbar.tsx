import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Badge from "@/components/ui/Badge";

export default function AdminTopbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="bg-surface-elevated border-b border-border-subtle sticky top-0 z-30">
      <div className="px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-sm text-text-muted hover:text-text-primary"
          >
            &larr; Shopper view
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user && (
            <>
              <span className="text-text-secondary">{user.email}</span>
              <Badge tone={user.role === "superadmin" ? "danger" : "warning"}>
                {user.role}
              </Badge>
            </>
          )}
          <button
            onClick={() => void handleLogout()}
            className="text-text-secondary hover:text-text-primary"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}