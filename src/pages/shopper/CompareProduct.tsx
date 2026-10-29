// src/pages/shopper/CompareProduct.tsx
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  getProductGroup,
  getGroupDetail,
  effectivePriceForListing,
  GroupListing,
} from "@/api/compare";
import { getProduct } from "@/api/products";
import { formatPrice, formatRelative } from "@/lib/format";
import { parseAvailability } from "@/lib/availability";
import SiteBadge from "@/components/product/SiteBadge";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { FullPageSpinner } from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import clsx from "clsx";

export default function CompareProduct() {
  const { id } = useParams<{ id: string }>();

  const productQuery = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });

  const groupLinkQuery = useQuery({
    queryKey: ["compareProductLink", id],
    queryFn: () => getProductGroup(id!),
    enabled: !!id,
  });

  const groupId = groupLinkQuery.data?.group_id ?? null;
  const groupDetailQuery = useQuery({
    queryKey: ["compareGroupDetail", groupId],
    queryFn: () => getGroupDetail(groupId!),
    enabled: !!groupId,
  });

  if (
    productQuery.isLoading ||
    groupLinkQuery.isLoading ||
    (groupId && groupDetailQuery.isLoading)
  ) {
    return <FullPageSpinner />;
  }

  if (groupLinkQuery.isError) {
    return (
      <ErrorState
        message={
          groupLinkQuery.error instanceof Error
            ? groupLinkQuery.error.message
            : "Failed to load comparison"
        }
        onRetry={() => groupLinkQuery.refetch()}
      />
    );
  }
  if (groupDetailQuery.isError) {
    return (
      <ErrorState
        message={
          groupDetailQuery.error instanceof Error
            ? groupDetailQuery.error.message
            : "Failed to load canonical details"
        }
        onRetry={() => groupDetailQuery.refetch()}
      />
    );
  }

  const product = productQuery.data;
  const groupLink = groupLinkQuery.data;
  const group = groupDetailQuery.data;

  if (!groupLink || groupLink.group_id === null) {
    return (
      <div className="max-w-[1200px] mx-auto space-y-6">
        <BackLink
          productId={id}
          site={product?.site}
          name={product?.name}
        />
        <Card>
          <div className="text-center py-12 px-6">
            <div className="text-4xl mb-3">🔍</div>
            <h1 className="text-xl font-semibold text-text-primary mb-2">
              No comparison available
            </h1>
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              This product isn't listed on other sites yet, or the matching
              pipeline hasn't processed it.
            </p>
            <Link
              to={`/products/${id}`}
              className="inline-block mt-6 px-4 py-2 rounded-base bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
            >
              Back to product
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (!group) {
    return <FullPageSpinner />;
  }

  // ═══════════════════════════════════════════════════════
  // Group listings by site; keep cheapest per site
  // ═══════════════════════════════════════════════════════
  const bySite = new Map<string, GroupListing[]>();
  for (const l of group.listings) {
    const arr = bySite.get(l.site) ?? [];
    arr.push(l);
    bySite.set(l.site, arr);
  }

  const siteGroups = Array.from(bySite.entries()).map(
    ([site, listings]) => {
      const sortedListings = [...listings].sort((a, b) => {
        const pa =
          effectivePriceForListing(a) ?? Number.POSITIVE_INFINITY;
        const pb =
          effectivePriceForListing(b) ?? Number.POSITIVE_INFINITY;
        return pa - pb;
      });
      return {
        site,
        cheapest: sortedListings[0]!,
        otherCount: sortedListings.length - 1,
        all: sortedListings,
      };
    },
  );

  // Sort site groups by their cheapest price
  siteGroups.sort((a, b) => {
    const pa =
      effectivePriceForListing(a.cheapest) ?? Number.POSITIVE_INFINITY;
    const pb =
      effectivePriceForListing(b.cheapest) ?? Number.POSITIVE_INFINITY;
    return pa - pb;
  });

  if (siteGroups.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto space-y-6">
        <BackLink
          productId={id}
          site={product?.site}
          name={product?.name}
        />
        <Card>
          <div className="text-center py-12 px-6">
            <p className="text-sm text-text-secondary">
              This product has no active listings to compare.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // The cheapest site overall
  const cheapest = siteGroups[0]!;
  const cheapestPrice = effectivePriceForListing(cheapest.cheapest);
  const mostExpensive = siteGroups
    .map((g) => effectivePriceForListing(g.cheapest))
    .filter((p): p is number => p != null)
    .reduce((max, p) => (p > max ? p : max), 0);
  const savings =
    cheapestPrice != null &&
    mostExpensive > cheapestPrice &&
    mostExpensive > 0
      ? mostExpensive - cheapestPrice
      : null;
  const savingsPct =
    savings != null && mostExpensive > 0
      ? Math.round((savings / mostExpensive) * 100)
      : null;

  const distinctSiteCount = siteGroups.length;

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <BackLink
        productId={id}
        site={product?.site}
        name={product?.name}
      />

      {/* ── Price hero ──────────────────────────────── */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-text-muted mb-1">
              Cheapest among {distinctSiteCount} site
              {distinctSiteCount === 1 ? "" : "s"}
            </div>
            <h1 className="text-2xl font-semibold text-text-primary mb-1">
              {group.canonical_name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {group.canonical_brand && (
                <Badge tone="gray">{group.canonical_brand}</Badge>
              )}
              {group.canonical_category && (
                <Badge tone="gray">{group.canonical_category}</Badge>
              )}
              {group.confidence > 0 && (
                <Badge tone="info">
                  {Math.round(group.confidence * 100)}% match
                </Badge>
              )}
            </div>
          </div>

          <div className="md:text-right">
            <div className="text-xs uppercase tracking-wider text-text-muted">
              From
            </div>
            <div className="text-4xl font-extrabold text-brand-600 leading-none">
              {formatPrice(cheapestPrice)}
            </div>
            <div className="text-sm text-text-secondary mt-1">
              at {cheapest.site}
            </div>
            {savings != null && savings > 0 && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success-50 text-success-700 px-3 py-1 text-xs font-medium">
                Save {formatPrice(savings)} ({savingsPct}%) vs most expensive
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Site cards ──────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">
          Prices across {distinctSiteCount}{" "}
          {distinctSiteCount === 1 ? "site" : "sites"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {siteGroups.map((sg, idx) => (
            <SiteCard
              key={sg.site}
              siteGroup={sg}
              isCheapest={idx === 0}
            />
          ))}
        </div>
      </div>

      {/* ── Detailed table ──────────────────────────── */}
      <Card>
        <details className="group">
          <summary className="cursor-pointer list-none flex items-center justify-between">
            <span className="text-sm font-semibold text-text-primary">
              Detailed comparison
            </span>
            <span className="text-xs text-text-muted group-open:hidden">
              Show
            </span>
            <span className="text-xs text-text-muted hidden group-open:inline">
              Hide
            </span>
          </summary>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-text-muted text-xs uppercase tracking-wider">
                  <th className="py-2 pr-3">Site</th>
                  <th className="py-2 pr-3">Listings</th>
                  <th className="py-2 pr-3">Price from</th>
                  <th className="py-2 pr-3">Availability</th>
                  <th className="py-2 pr-3">Last checked</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {siteGroups.map((sg) => {
                  const l = sg.cheapest;
                  return (
                    <tr
                      key={sg.site}
                      className="border-b border-border-subtle last:border-0"
                    >
                      <td className="py-3 pr-3">
                        <SiteBadge site={sg.site} />
                      </td>
                      <td className="py-3 pr-3 text-text-secondary">
                        {sg.otherCount > 0
                          ? `${sg.all.length} variants`
                          : "1"}
                      </td>
                      <td className="py-3 pr-3 font-semibold text-text-primary">
                        {formatPrice(effectivePriceForListing(l))}
                      </td>
                      <td className="py-3 pr-3 text-text-secondary">
                        {l.availability ?? "unknown"}
                      </td>
                      <td className="py-3 pr-3 text-text-muted text-xs">
                        {l.last_checked
                          ? formatRelative(l.last_checked)
                          : "—"}
                      </td>
                      <td className="py-3 text-right">
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-brand-600 hover:text-brand-700"
                        >
                          Open →
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      </Card>

      {group.base_group_id && (
        <div className="text-center">
          <Link
            to={`/compare/base/${group.base_group_id}`}
            className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
          >
            See other variants in this model family →
          </Link>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Site card — one per site, shows cheapest + "+N more"
// ═══════════════════════════════════════════════════════
function SiteCard({
  siteGroup,
  isCheapest,
}: {
  siteGroup: {
    site: string;
    cheapest: GroupListing;
    otherCount: number;
    all: GroupListing[];
  };
  isCheapest: boolean;
}) {
  const { site, cheapest, otherCount, all } = siteGroup;
  const eff = effectivePriceForListing(cheapest);
  const hasDisc =
    cheapest.discount_price != null &&
    cheapest.discount_price > 0 &&
    cheapest.price != null &&
    cheapest.price > cheapest.discount_price;
  const avail = parseAvailability(cheapest.availability);
  const inStock = avail !== false;
  const isUnknown = avail === null;

  return (
    <Card
      padded={false}
      className={clsx(
        "overflow-hidden transition-shadow hover:shadow-md",
        isCheapest
          ? "ring-2 ring-brand-500"
          : "ring-1 ring-border-subtle",
      )}
    >
      {isCheapest && (
        <div className="bg-brand-600 text-white text-xs font-semibold text-center py-1.5">
          ⭐ CHEAPEST
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <SiteBadge site={site} />
          <Badge
            tone={isUnknown ? "gray" : inStock ? "success" : "warning"}
          >
            {cheapest.availability ?? "unknown"}
          </Badge>
        </div>

        <div className="flex gap-3">
          <div className="w-16 h-16 flex-shrink-0 rounded-md bg-neutral-100 dark:bg-neutral-200 overflow-hidden">
            {cheapest.main_image ? (
              <img
                src={cheapest.main_image}
                alt={cheapest.name}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                —
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-text-primary font-medium line-clamp-2">
              {cheapest.name}
            </div>
            {cheapest.main_product_id && (
              <div className="text-[10px] text-text-muted font-mono mt-0.5">
                {cheapest.main_product_id}
              </div>
            )}
          </div>
        </div>

        <div className="pt-1">
          <div className="flex items-baseline gap-2">
            <span
              className={clsx(
                "text-2xl font-extrabold",
                hasDisc ? "text-danger-600" : "text-text-primary",
              )}
            >
              {formatPrice(eff)}
            </span>
            {hasDisc && (
              <span className="text-sm text-text-muted line-through">
                {formatPrice(cheapest.price)}
              </span>
            )}
          </div>
          {hasDisc && (
            <div className="text-xs text-success-700 font-medium mt-0.5">
              Save {formatPrice(cheapest.price! - eff!)}
            </div>
          )}
        </div>

        <a
          href={cheapest.url}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            "block text-center h-10 leading-10 rounded-base text-sm font-medium transition-colors",
            isCheapest
              ? "bg-brand-600 text-white hover:bg-brand-700"
              : "bg-surface-elevated border border-border-strong text-text-primary hover:border-brand-500 hover:text-brand-600",
          )}
        >
          Buy on {site}
        </a>

        {otherCount > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-text-muted hover:text-text-primary">
              +{otherCount} more{" "}
              {otherCount === 1 ? "variant" : "variants"} on {site}
            </summary>
            <ul className="mt-2 space-y-1.5 pl-2 border-l-2 border-border-subtle">
              {all.slice(1).map((l) => {
                const oEff = effectivePriceForListing(l);
                return (
                  <li
                    key={l.product_id}
                    className="flex items-baseline gap-2 text-text-secondary"
                  >
                    <span className="font-semibold text-text-primary flex-shrink-0">
                      {formatPrice(oEff)}
                    </span>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate hover:text-brand-600"
                      title={l.name}
                    >
                      {l.name}
                    </a>
                  </li>
                );
              })}
            </ul>
          </details>
        )}
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════
// Back link
// ═══════════════════════════════════════════════════════
function BackLink({
  productId,
  site,
  name,
}: {
  productId?: string | undefined;
  site?: string | undefined;
  name?: string | undefined;
}) {
  const label =
    site && name
      ? `Back to ${
          name.length > 40 ? name.slice(0, 40) + "…" : name
        } on ${site}`
      : "Back to product";
  return (
    <Link
      to={productId ? `/products/${productId}` : "/products"}
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
      {label}
    </Link>
  );
}