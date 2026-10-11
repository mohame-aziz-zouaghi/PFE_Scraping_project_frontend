import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAlerts, resolveAlert } from "@/api/alerts";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { formatRelative } from "@/lib/format";

export default function Alerts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["alerts", { page: 1, page_size: 50 }],
    queryFn: () => listAlerts({ page: 1, page_size: 50 }),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: number) => resolveAlert(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Alerts</h1>
        <p className="text-sm text-text-muted mt-1">
          Price and availability changes on your products
        </p>
      </div>

      <Card padded={false}>
        {query.isLoading && (
          <div className="p-6 text-sm text-text-muted">Loading...</div>
        )}
        {query.isError && (
          <ErrorState
            message={
              query.error instanceof Error
                ? query.error.message
                : "Failed to load alerts"
            }
            onRetry={() => query.refetch()}
          />
        )}
        {query.data && query.data.items.length === 0 && (
          <EmptyState
            title="No alerts yet"
            description="You'll see alerts here when monitored products change."
          />
        )}
        {query.data && query.data.items.length > 0 && (
          <ul className="divide-y divide-border-subtle">
            {query.data.items.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-text-primary">
                      {a.alert_type ?? "Alert"}
                    </span>
                    {a.severity && (
                      <Badge
                        tone={
                          a.severity === "high"
                            ? "danger"
                            : a.severity === "medium"
                              ? "warning"
                              : "gray"
                        }
                      >
                        {a.severity}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-text-muted">
                    {a.site ?? "unknown site"} &middot;{" "}
                    {formatRelative(a.created_at)}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={a.is_resolved || resolveMutation.isPending}
                  onClick={() => resolveMutation.mutate(a.id)}
                >
                  {a.is_resolved ? "Resolved" : "Mark resolved"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}