import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProduct } from "@/api/products";
import { useViewLogger } from "@/hooks/useEventLogger";
import SiteBadge from "@/components/product/SiteBadge";
import Stars from "@/components/ui/Stars";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { FullPageSpinner } from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import {
  effectivePrice,
  formatDate,
  formatDateTime,
  formatPrice,
  formatRelative,
  hasDiscount,
} from "@/lib/format";
import { parseAvailability } from "@/lib/availability";
import clsx from "clsx";
import WishlistButton from "@/components/product/WishlistButton";
import SimilarProductsRow from "@/components/recommendations/SimilarProductsRow";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });

  // Fires view + dwell events for authenticated users.
  useViewLogger(id);

  if (query.isLoading) return <FullPageSpinner />;
  if (query.isError)
    return (
      <ErrorState
        message={
          query.error instanceof Error
            ? query.error.message
            : "Failed to load product"
        }
        onRetry={() => query.refetch()}
      />
    );
  if (!query.data) return null;

  const p = query.data;
  const effective = effectivePrice(p);
  const discounted = hasDiscount(p);
  const rating = 4.7;
  const avail = parseAvailability(p.availability);
  const inStock = avail !== false;
  const isUnknownAvail = avail === null;

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <Link
        to="/products"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
        Back to products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {/* ── Images ───────────────────────────────────── */}
        <div className="space-y-3">
          <Card padded={false} className="overflow-hidden">
            <div className="aspect-square bg-neutral-100 dark:bg-neutral-200 relative">
              {p.main_image ? (
                <img
                  src={p.main_image}
                  alt={p.name ?? ""}
                  className="w-full h-full object-contain p-8"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                  No image available
                </div>
              )}
              {discounted && p.price != null && effective != null && (
                <span className="absolute top-4 left-4 inline-flex items-center rounded-full bg-danger-600 px-3 py-1 text-sm font-semibold text-white shadow">
                  -
                  {Math.round(
                    ((p.price - effective) / p.price) * 100,
                  )}
                  %
                </span>
              )}
            </div>
          </Card>

          {Array.isArray(p.images) && p.images.length > 0 && (
            <div className="grid grid-cols-5 gap-2">
              {p.images.slice(0, 10).map((img, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-base border border-border-subtle bg-surface-elevated overflow-hidden"
                >
                  <img
                    src={typeof img === "string" ? img : String(img)}
                    alt=""
                    className="w-full h-full object-contain p-2"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Info ─────────────────────────────────────── */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <SiteBadge site={p.site} />
            <Badge
              tone={
                isUnknownAvail
                  ? "gray"
                  : inStock
                    ? "success"
                    : "warning"
              }
            >
              {p.availability ?? "unknown"}
            </Badge>
            {p.is_enabled === false && <Badge tone="gray">Disabled</Badge>}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary leading-tight">
            {p.name ?? "Untitled product"}
          </h1>

          <div className="flex items-center gap-2">
            <Stars rating={rating} size={18} />
            <span className="text-sm text-text-secondary font-medium">
              {rating.toFixed(1)}
            </span>
          </div>

          <div className="flex items-baseline gap-3 pt-2">
            <span
              className={clsx(
                "text-3xl sm:text-4xl font-extrabold",
                discounted ? "text-danger-600" : "text-text-primary",
              )}
            >
              {formatPrice(effective)}
            </span>
            {discounted && p.price != null && (
              <span className="text-lg text-text-muted line-through">
                {formatPrice(p.price)}
              </span>
            )}
          </div>

          {p.price_valid_until && (
            <p className="text-xs text-text-muted">
              Price valid until {formatDate(p.price_valid_until)}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-4 items-center">
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-base bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-xs transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
              Open on {p.site}
            </a>

            <WishlistButton
              productId={p.id}
              size="lg"
              onRequireAuth={() => {
                window.location.href = "/login";
              }}
            />

            {p.canonical_id && (
              <Link
                to={`/compare/product/${p.id}`}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-base bg-surface-elevated border border-border-strong text-text-primary hover:border-brand-500 hover:text-brand-600 font-medium transition-colors"
              >
                Compare across sites
              </Link>
            )}
          </div>

          <Card className="mt-6">
            <h2 className="text-sm font-semibold text-text-primary mb-4">
              Details
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {p.brand && <Field label="Brand" value={p.brand} />}
              {p.category && (
                <Field label="Category" value={p.category} />
              )}
              {p.main_product_id && (
                <Field
                  label="Site product ID"
                  value={p.main_product_id}
                  mono
                />
              )}
              {p.special_id && (
                <Field
                  label="Special ID"
                  value={p.special_id}
                  mono
                />
              )}
              {p.last_checked && (
                <Field
                  label="Last checked"
                  value={formatRelative(p.last_checked)}
                />
              )}
              {p.last_updated_at && (
                <Field
                  label="Last updated"
                  value={formatDateTime(p.last_updated_at)}
                />
              )}
              {p.avg_price != null && (
                <Field
                  label="Average price"
                  value={formatPrice(Number(p.avg_price))}
                />
              )}
              {p.min_price != null && (
                <Field
                  label="Lowest seen"
                  value={formatPrice(Number(p.min_price))}
                />
              )}
              {p.max_price != null && (
                <Field
                  label="Highest seen"
                  value={formatPrice(Number(p.max_price))}
                />
              )}
              {p.price_change_count != null &&
                p.price_change_count > 0 && (
                  <Field
                    label="Price changes"
                    value={`${p.price_change_count} changes`}
                  />
                )}
              {p.price_trend && (
                <Field label="Trend" value={p.price_trend} />
              )}
            </dl>
          </Card>
        </div>
      </div>
      {/* Similar products */}
      {p.id && <SimilarProductsRow productId={p.id} />}
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-text-muted text-xs uppercase tracking-wider mb-0.5">
        {label}
      </dt>
      <dd
        className={clsx(
          "text-text-primary",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </dd>
    </div>
  );
}