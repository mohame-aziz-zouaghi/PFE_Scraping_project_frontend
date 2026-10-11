export function formatPrice(
  value: number | null | undefined,
  currency = "DT",
): string {
  if (value == null) return "\u2014";
  return `${value.toFixed(2)} ${currency}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return d.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return d.toLocaleString("fr-FR");
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "\u2014";
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} d ago`;
  return formatDate(iso);
}

export function effectivePrice(p: {
  price: number | null;
  discount_price: number | null;
}): number | null {
  if (p.price == null) return null;
  if (p.discount_price != null && p.discount_price > 0) {
    return p.discount_price;
  }
  return p.price;
}

export function hasDiscount(p: {
  price: number | null;
  discount_price: number | null;
}): boolean {
  return (
    p.price != null &&
    p.discount_price != null &&
    p.discount_price > 0 &&
    p.discount_price < p.price
  );
}