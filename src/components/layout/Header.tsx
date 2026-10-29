import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";
import Badge from "@/components/ui/Badge";
import { useWishlist } from "@/hooks/useWishlist";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export default function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      "px-3 py-2 text-sm rounded-md transition-colors",
      isActive
        ? "text-brand-700 dark:text-brand-400 font-medium"
        : "text-text-secondary hover:text-brand-700 dark:hover:text-brand-400",
    );

  return (
    <header className="bg-surface-elevated/90 backdrop-blur border-b border-border-subtle sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand-600 flex items-center justify-center text-white font-bold">
              P
            </div>
            <span className="text-lg font-semibold text-text-primary">
              PriceMonitor
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/products" className={linkClass}>
              Products
            </NavLink>
            <NavLink to="/search" className={linkClass}>
              Search
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/alerts" className={linkClass}>
                Alerts
              </NavLink>
            )}
            {isAuthenticated && (
              <NavLink to="/wishlist" className={linkClass}>
                <span className="inline-flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                    />
                  </svg>
                  Wishlist
                  <WishlistCountBadge />
                </span>
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {/* ── Notification bell (auth only) ──────── */}
            {isAuthenticated && <NotificationBell />}

            {isAuthenticated && user ? (
              <>
                <Link
                  to="/account"
                  className="text-sm text-text-secondary hover:text-brand-700"
                >
                  {user.email}
                </Link>
                {user.role !== "user" && (
                  <Badge
                    tone={user.role === "superadmin" ? "danger" : "warning"}
                  >
                    {user.role}
                  </Badge>
                )}
                <button
                  onClick={() => void handleLogout()}
                  className="text-sm text-text-secondary hover:text-brand-700"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-text-secondary hover:text-brand-700"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center h-9 px-4 text-sm font-medium rounded-md bg-brand-600 text-white hover:bg-brand-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-md hover:bg-surface-overlay"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border-subtle px-4 py-2 space-y-1">
          <NavLink
            to="/"
            end
            className={linkClass}
            onClick={() => setMobileOpen(false)}
          >
            Home
          </NavLink>
          <NavLink
            to="/products"
            className={linkClass}
            onClick={() => setMobileOpen(false)}
          >
            Products
          </NavLink>
          <NavLink
            to="/search"
            className={linkClass}
            onClick={() => setMobileOpen(false)}
          >
            Search
          </NavLink>
          {isAuthenticated && (
            <NavLink
              to="/alerts"
              className={linkClass}
              onClick={() => setMobileOpen(false)}
            >
              Alerts
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink
              to="/wishlist"
              className={linkClass}
              onClick={() => setMobileOpen(false)}
            >
              Wishlist
              <WishlistCountBadge />
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={linkClass}
              onClick={() => setMobileOpen(false)}
            >
              Admin
            </NavLink>
          )}
          {/* ── Notifications link on mobile (auth only) ── */}
          {isAuthenticated && (
            <NavLink
              to="/notifications"
              className={linkClass}
              onClick={() => setMobileOpen(false)}
            >
              Notifications
            </NavLink>
          )}
        </div>
      )}
    </header>
  );
}

function WishlistCountBadge() {
  const { count, isLoading } = useWishlist();
  if (isLoading || count === 0) return null;
  return (
    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-danger-600 text-white text-[10px] font-semibold">
      {count > 99 ? "99+" : count}
    </span>
  );
}