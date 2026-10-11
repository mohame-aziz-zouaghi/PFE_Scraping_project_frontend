import ProductCard from "./ProductCard";
import SkeletonCard from "./SkeletonCard";
import type { ProductSummary } from "@/api/products";

export default function ProductGrid({
  products,
  loading = false,
  skeletonCount = 12,
  onCardClick,
  highlightQuery,

}: {
  products?: ProductSummary[];
  loading?: boolean;
  skeletonCount?: number;
  onCardClick?: (p: ProductSummary, index: number) => void;
  highlightQuery?: string;

}) {
  const gridClass =
    "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-4 sm:gap-5";

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <div className={gridClass}>
      {products.map((p, i) => (
        <ProductCard
          key={p.id}
          product={p}
          {...(onCardClick ? { onClick: () => onCardClick(p, i) } : {})}
          {...(highlightQuery ? { highlightQuery } : {})}

        />
      ))}
    </div>
  );
}