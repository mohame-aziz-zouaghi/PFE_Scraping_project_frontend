import { Link } from "react-router-dom";
import { useWishlist } from "@/hooks/useWishlist";
import ProductCard from "@/components/product/ProductCard";
import SkeletonCard from "@/components/product/SkeletonCard";
import EmptyState from "@/components/ui/EmptyState";
import type { ProductSummary } from "@/api/products";
import { useClickLogger } from "@/hooks/useEventLogger";

/**
 * Wishlist page — reads from /wishlist (full item list with
 * snapshots) and renders them with the same ProductCard used
 * everywhere else.
 *
 * The snapshot fields on WishlistItem match the shape of
 * ProductSummary, so we adapt them into the ProductCard contract.
 */
export default function Wishlist() {
  const { full, fullLoading, count } = useWishlist();
  const logClick = useClickLogger();

  const products: ProductSummary[] = (full?.items ?? []).map((i) => ({
    id: i.product_id,
    site: i.site ?? "",
    main_product_id: null,
    special_id: null,
    name: i.name ?? "Untitled",
    brand: i.brand,
    category: i.category,
    price: i.price,
    discount_price: i.discount_price,
    discount_amount: null,
    availability: i.availability,
    url: i.url ?? "",
    main_image: i.main_image,
    last_updated_at: null,
    last_checked: null,
  }));

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Wishlist
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {count === 0
              ? "Products you save will appear here"
              : `${count} ${count === 1 ? "product" : "products"} saved`}
          </p>
        </div>
        <Link
          to="/products"
          className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
        >
          Browse products →
        </Link>
      </div>

      {fullLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!fullLoading && (!full || full.items.length === 0) && (
        <EmptyState
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it here."
          action={
            <Link
              to="/products"
              className="inline-flex items-center h-10 px-5 rounded-base bg-brand-600 text-white font-medium hover:bg-brand-700"
            >
              Start browsing
            </Link>
          }
        />
      )}

      {!fullLoading && full && full.items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
          {products.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              onClick={() => logClick(p.id, "products", i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}