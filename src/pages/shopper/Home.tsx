import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/api/products";
import ProductGrid from "@/components/product/ProductGrid";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { useClickLogger } from "@/hooks/useEventLogger";
import RecommendationsHomeRow from "@/components/recommendations/RecommendationsHomeRow";

export default function Home() {
  const logClick = useClickLogger();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["products", "home"],
    queryFn: () =>
      listProducts({
        page: 1,
        page_size: 8,
        sort_by: "last_updated_at",
        sort_order: "desc",
      }),
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 sm:space-y-16">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 sm:px-10 py-12 sm:py-20 text-white shadow-card">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight tracking-tight">
            Compare prices across Tunisia
          </h1>
          <p className="mt-4 text-base sm:text-lg text-brand-50">
            Find the best deal on electronics, appliances, and more. We track
            6 major retailers so you don't have to.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="inline-flex items-center h-11 px-6 rounded-base bg-white text-brand-700 font-medium hover:bg-brand-50 transition-colors shadow-xs"
            >
              Browse products
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center h-11 px-6 rounded-base bg-white/10 text-white font-medium hover:bg-white/20 transition-colors backdrop-blur"
            >
              Search now
            </Link>
          </div>
        </div>
      </section>

      {/* Recommended for you — horizontal scroll */}
      <RecommendationsHomeRow />

      {/* New arrivals — vertical grid */}
      <section>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
              New arrivals
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Fresh listings across all sites
            </p>
          </div>
          <Link
            to="/products"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
          >
            View all →
          </Link>
        </div>

        {isLoading && <ProductGrid loading skeletonCount={8} />}

        {isError && (
          <div className="text-center py-12">
            <p className="text-danger-600">
              {error instanceof Error ? error.message : "Failed to load"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        )}

        {data && data.items.length === 0 && (
          <EmptyState
            title="No products yet"
            description="Products will appear here once the scrapers run."
          />
        )}

        {data && data.items.length > 0 && (
          <ProductGrid
            products={data.items}
            onCardClick={(p, i) => logClick(p.id, "home", i)}
          />
        )}
      </section>
    </div>
  );
}