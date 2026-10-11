import { Link } from "react-router-dom";
import clsx from "clsx";
import SiteBadge from "@/components/product/SiteBadge";
import { effectivePrice, formatPrice, hasDiscount } from "@/lib/format";
import { isInStock } from "@/lib/availability";
import type { RecommendedItem } from "@/api/recommendations";

export default function RecommendationCard({
  item,
  onClick,
}: {
  item: RecommendedItem;
  onClick?: () => void;
}) {
  const effective = effectivePrice({
    price: item.price,
    discount_price: item.discount_price,
  });
  const discounted = hasDiscount({
    price: item.price,
    discount_price: item.discount_price,
  });
  const inStock = isInStock(item.availability);

  return (
    <Link
      to={`/products/${item.product_id}`}
      onClick={onClick}
      className={clsx(
        "snap-start shrink-0 w-[220px] group flex flex-col",
        "bg-surface-elevated border border-border-subtle rounded-base",
        "shadow-xs hover:shadow-card-hover transition-all duration-200",
        "overflow-hidden",
      )}
    >
      <div className="relative aspect-square bg-neutral-100 dark:bg-neutral-200 overflow-hidden">
        {item.main_image ? (
          <img
            src={item.main_image}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25z"
              />
            </svg>
          </div>
        )}
        {discounted && item.price != null && effective != null && (
          <span className="absolute top-2 left-2 inline-flex items-center rounded-full bg-danger-600 px-2 py-0.5 text-[10px] font-semibold text-white">
            -{Math.round(((item.price - effective) / item.price) * 100)}%
          </span>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="rounded-full bg-white/95 text-gray-900 text-[10px] font-semibold px-2 py-1">
              Out of stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3 gap-2">
        <SiteBadge site={item.site} />

        <h3 className="text-xs font-medium leading-snug text-text-primary line-clamp-2 min-h-[2rem] group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {item.name}
        </h3>

        {item.reason && (
          <p className="text-[10px] italic text-text-muted line-clamp-2 min-h-[1.5rem]">
            {item.reason}
          </p>
        )}

        <div className="flex items-end justify-between gap-2 pt-1 mt-auto">
          <span className="text-base font-bold text-text-primary truncate">
            {formatPrice(effective)}
          </span>
        </div>
      </div>
    </Link>
  );
}