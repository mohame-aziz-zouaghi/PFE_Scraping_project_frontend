import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Stars from "@/components/ui/Stars";
import SiteBadge from "./SiteBadge";
import { effectivePrice, formatPrice, hasDiscount } from "@/lib/format";
import type { ProductSummary } from "@/api/products";
import { isInStock } from "@/lib/availability";
import clsx from "clsx";
import WishlistButton from "./WishlistButton";
import Highlighted from "../search/Highlighted";

export default function ProductCard({
  product,
  onClick,
  highlightQuery,

}: {
  product: ProductSummary;
  onClick?: () => void;
  highlightQuery?: string;
}) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [product.main_image]);

  const rating = getStableRating(product.id);
  const effective = effectivePrice(product);
  const discounted = hasDiscount(product);
  const inStock = isInStock(product.availability);

  return (
    <article
      className={clsx(
        "group flex flex-col w-full",
        "bg-surface-elevated border border-border-subtle rounded-base",
        "shadow-xs hover:shadow-card-hover transition-all duration-200",
        "overflow-hidden",
      )}
    >
      <Link
        to={`/products/${product.id}`}
        onClick={onClick}
        className="relative block aspect-square bg-neutral-100 dark:bg-neutral-200 overflow-hidden"
        aria-label={product.name}
      >
        {product.main_image && !imageError ? (
          <img
            src={product.main_image}
            alt={product.name}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-contain p-6 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-16 h-16 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
        )}

        {discounted && product.price != null && effective != null && (
          <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-danger-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
            -{Math.round(((product.price - effective) / product.price) * 100)}%
          </span>
        )}

        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="rounded-full bg-white/95 text-gray-900 text-xs font-semibold px-3 py-1.5">
              Out of stock
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3 z-[1]">
          <WishlistButton
            productId={product.id}
            size="sm"
            onRequireAuth={() => {
              // Let the caller decide. If nothing passed, fall through
              // to the /login redirect behavior of ProtectedRoute.
              window.location.href = "/login";
            }}
          />
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex items-center justify-between gap-2">
          <SiteBadge site={product.site} />
          <div className="flex items-center gap-1.5">
            <Stars rating={rating} size={14} />
            <span className="text-xs font-medium text-text-muted">
              {rating.toFixed(1)}
            </span>
          </div>
        </div>

        <Link
          to={`/products/${product.id}`}
          onClick={onClick}
          className="block flex-1"
        >
          <h3 className="text-sm font-medium leading-snug text-text-primary line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 text-xs text-text-muted min-h-[1rem]">
        {product.brand && (
          <span className="truncate">
            {highlightQuery ? (
              <Highlighted text={product.brand} query={highlightQuery} />
            ) : (
              product.brand
            )}
          </span>
        )}          
        {product.brand && product.category && <span>·</span>}
        {product.category && (
          <span className="truncate">
            {highlightQuery ? (
              <Highlighted text={product.category} query={highlightQuery} />
            ) : (
              product.category
            )}
          </span>
        )}
        </div>

        <div className="flex items-end justify-between gap-3 pt-1 mt-auto">
          <div className="flex flex-col min-w-0">
            <span className="text-lg sm:text-xl font-bold text-text-primary truncate">
              {formatPrice(effective)}
            </span>
            {discounted && product.price != null && (
              <span className="text-xs text-text-muted line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <Link
            to={`/products/${product.id}`}
            onClick={onClick}
            className={clsx(
              "inline-flex items-center justify-center gap-1.5 shrink-0",
              "rounded-base text-sm font-medium leading-5 px-3 py-2",
              "text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800",
              "shadow-xs transition-colors",
              "focus:outline-none focus:ring-4 focus:ring-brand-500/30",
            )}
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}

function getStableRating(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  const normalized = Math.abs(h) / 2147483647;
  return Math.round((4.0 + normalized * 1.0) * 10) / 10;
}