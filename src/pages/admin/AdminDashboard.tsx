import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/api/products";
import { listAlerts } from "@/api/alerts";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatRelative } from "@/lib/format";

function StatCard({
  label,
  value,
  tone = "gray",
}: {
  label: string;
  value: string | number;
  tone?: "gray" | "brand" | "success" | "warning" | "danger";
}) {
  return (
    <Card>
      <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-text-primary">{value}</span>
        <Badge tone={tone}>live</Badge>
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const productsQuery = useQuery({
    queryKey: ["admin", "products-count"],
    queryFn: () => listProducts({ page: 1, page_size: 1 }),
  });

  const alertsQuery = useQuery({
    queryKey: ["admin", "alerts-count"],
    queryFn: () => listAlerts({ page: 1, page_size: 5, is_resolved: false }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Admin dashboard
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Overview of your catalog and alerts
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Products"
          value={productsQuery.data?.total ?? "..."}
          tone="brand"
        />
        <StatCard
          label="Open alerts"
          value={alertsQuery.data?.total ?? "..."}
          tone="warning"
        />
        <StatCard label="Sites" value={6} tone="success" />
        <StatCard label="Status" value="Operational" tone="success" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">
            Recent alerts
          </h2>
        </div>
        {alertsQuery.data && alertsQuery.data.items.length === 0 && (
          <p className="text-sm text-text-muted">No open alerts.</p>
        )}
        {alertsQuery.data && alertsQuery.data.items.length > 0 && (
          <ul className="divide-y divide-border-subtle -mx-6">
            {alertsQuery.data.items.map((a) => (
              <li
                key={a.id}
                className="px-6 py-3 flex items-center justify-between text-sm"
              >
                <div>
                  <span className="font-medium">{a.alert_type ?? "Alert"}</span>{" "}
                  <span className="text-text-muted">
                    on {a.site ?? "unknown"}
                  </span>
                </div>
                <span className="text-xs text-text-muted">
                  {formatRelative(a.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}