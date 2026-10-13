import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listProducts, type ListProductsParams } from "@/api/products";
import ProductGrid from "@/components/product/ProductGrid";
import ProductFilters from "@/components/product/ProductFilters";
import type { Filters } from "@/components/product/productFilterTypes";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Button from "@/components/ui/Button";
import { useClickLogger } from "@/hooks/useEventLogger";

const DEFAULT_FILTERS: Filters = {
  site: "",
  brand: "",
  category: "",
  availability: "",
  sort_by: "last_updated_at",
  sort_order: "desc",
};

export default function Products() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const logClick = useClickLogger();

  const params: ListProductsParams = useMemo(
    () => ({
      page,
      page_size: 24,
      ...(filters.site ? { site: filters.site } : {}),
      ...(filters.brand ? { brand: filters.brand } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.availability
        ? { availability: filters.availability }
        : {}),
      sort_by: filters.sort_by,
      sort_order: filters.sort_order,
    }),
    [page, filters],
  );

  const query = useQuery({
    queryKey: ["products", params],
    queryFn: () => listProducts(params),
  });

  const handleFilterChange = (next: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...next }));
    setPage(1);
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Products
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {query.data ? `${query.data.total} products` : "Loading…"}
          </p>
        </div>
      </div>

      <div className="flex gap-6 lg:gap-8">
        <ProductFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
        />

        <div className="flex-1 min-w-0 space-y-6">
          {query.isLoading && <ProductGrid loading skeletonCount={16} />}

          {query.isError && (
            <ErrorState
              message={
                query.error instanceof Error
                  ? query.error.message
                  : "Failed to load products"
              }
              onRetry={() => query.refetch()}
            />
          )}

          {query.data && query.data.items.length === 0 && (
            <EmptyState
              title="No products match your filters"
              description="Try removing a filter or broadening your search."
              action={
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Reset filters
                </Button>
              }
            />
          )}

          {query.data && query.data.items.length > 0 && (
            <>
              <ProductGrid
                products={query.data.items}
                onCardClick={(p, i) => logClick(p.id, "products", i)}
              />

              {query.data.total_pages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                  <span className="text-sm text-text-muted">
                    Page {query.data.page} of {query.data.total_pages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= query.data.total_pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}