import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";

const baseItems = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/alerts", label: "Alerts" },
  { to: "/admin/analytics", label: "Analytics" },
];

const superItems = [
  { to: "/super", label: "Super Dashboard", end: true },
  { to: "/super/matching", label: "Matching" },
  { to: "/super/backfill", label: "Backfill" },
  { to: "/super/audit", label: "Audit" },
];

export default function AdminSidebar() {
  const { isSuperAdmin } = useAuth();

  const renderLink = (item: { to: string; label: string; end?: boolean }) => (
  <NavLink
    key={item.to}
    to={item.to}
    end={item.end ?? false}
    className={({ isActive }) =>
      clsx(
        "block px-3 py-2 rounded-md text-sm transition-colors",
        isActive
          ? "bg-brand-600 text-white"
          : "text-text-secondary hover:bg-surface-overlay",
      )
    }
  >
    {item.label}
  </NavLink>
);

  return (
    <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 border-r border-border-subtle bg-surface-elevated min-h-screen">
      <div className="p-4 border-b border-border-subtle">
        <div className="text-sm font-semibold text-text-primary">Admin Console</div>
      </div>
      <nav className="p-3 space-y-1">
        {baseItems.map(renderLink)}
        {isSuperAdmin && (
          <>
            <div className="px-3 pt-4 pb-1 text-xs font-semibold text-text-muted uppercase">
              Super Admin
            </div>
            {superItems.map(renderLink)}
          </>
        )}
      </nav>
    </aside>
  );
}