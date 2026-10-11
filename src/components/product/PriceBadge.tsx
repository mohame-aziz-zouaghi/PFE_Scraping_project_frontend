import { effectivePrice, formatPrice, hasDiscount } from "@/lib/format";

export default function PriceBadge({
  price,
  discount_price,
}: {
  price: number | null;
  discount_price: number | null;
}) {
  const effective = effectivePrice({ price, discount_price });
  const discounted = hasDiscount({ price, discount_price });

  return (
    <div className="flex items-baseline gap-2">
      <span
        className={
          discounted
            ? "text-lg font-semibold text-danger-600"
            : "text-lg font-semibold text-text-primary"
        }
      >
        {formatPrice(effective)}
      </span>
      {discounted && price != null && (
        <span className="text-sm text-text-muted line-through">
          {formatPrice(price)}
        </span>
      )}
    </div>
  );
}