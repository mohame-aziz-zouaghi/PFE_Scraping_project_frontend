import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/api/products";
import Card from "@/components/ui/Card";
import { formatPrice, formatRelative } from "@/lib/format";
import SiteBadge from "@/components/product/SiteBadge";
import ErrorState from "@/components/ui/ErrorState";

export default function AdminProducts() {
  const query = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => listProducts({ page: 1, page_size: 50 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Products</h1>
        <p className="text-sm text-text-muted mt-1">
          Raw listings as scraped from each site
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
                : "Failed to load"
            }
            onRetry={() => query.refetch()}
          />
        )}
        {query.data && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-text-secondary">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-text-secondary">
                    Site
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-text-secondary">
                    Price
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-text-secondary">
                    Checked
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {query.data.items.map((p) => (
                  <tr key={p.id} className="hover:bg-surface">
                    <td className="px-4 py-2 max-w-md truncate">{p.name}</td>
                    <td className="px-4 py-2">
                      <SiteBadge site={p.site} />
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatPrice(p.price)}
                    </td>
                    <td className="px-4 py-2 text-text-muted">
                      {formatRelative(p.last_checked)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}