import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/products", label: "Products" },
  { to: "/alerts", label: "Alerts" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-surface-elevated border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-8">
              <Link to="/" className="font-semibold text-brand-700">
                Price Monitor
              </Link>
              {user && (
                <nav className="flex items-center gap-4 text-sm">
                  {nav.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={clsx(
                        "px-3 py-1.5 rounded-md transition-colors",
                        location.pathname === item.to
                          ? "bg-brand-50 text-brand-700 font-medium"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface",
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              )}
            </div>
            {user && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-text-secondary">{user.email}</span>
                <button
                  onClick={() => void handleLogout()}
                  className="px-3 py-1.5 rounded-md text-text-secondary hover:bg-surface"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>
    </div>
  );
}