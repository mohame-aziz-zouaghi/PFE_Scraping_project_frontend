/**
 * Availability normalization.
 *
 * The scraper writes site-native values. This module maps them to a
 * canonical classification so UI code doesn't have to guess.
 *
 * Real values seen in this project (extend as needed):
 *   tunisianet:  "En Stock" / "Rupture de stock" / "Disponible"
 *   megapc:      "in stock" / "out of stock"
 *   sbs:         "Disponible" / "Indisponible"
 *   mytek:       "En stock" / "Rupture"
 *   spacenet:    "Disponible" / "Rupture"
 *   skymil:      "available" / "unavailable"
 *
 * Canonical DB values that the backend filters on:
 *   "InStock" / "OnOrder" / "OutOfStock"
 * Keep these in sync with `SELLABLE_AVAILABILITY` in the backend's
 * `app/core/recommendation_config.py`.
 */

// ═══════════════════════════════════════════════════════
// Site list
// ═══════════════════════════════════════════════════════
export const SITES = [
  "megapc",
  "tunisianet",
  "sbs",
  "mytek",
  "spacenet",
  "skymil",
] as const;

export type Site = (typeof SITES)[number];

// ═══════════════════════════════════════════════════════
// Canonical availability values + filter options
// ═══════════════════════════════════════════════════════
export const AVAILABILITY_VALUES = [
  "InStock",
  "OnOrder",
  "OutOfStock",
] as const;

export type AvailabilityValue = (typeof AVAILABILITY_VALUES)[number];

export const AVAILABILITY_FILTER_OPTIONS: ReadonlyArray<{
  value: "" | AvailabilityValue;
  label: string;
}> = [
  { value: "", label: "Any" },
  { value: "InStock", label: "In stock" },
  { value: "OnOrder", label: "On order" },
  { value: "OutOfStock", label: "Out of stock" },
];

// ═══════════════════════════════════════════════════════
// Classification
// ═══════════════════════════════════════════════════════
export type AvailabilityKind =
  | "in_stock"
  | "on_order"
  | "out_of_stock"
  | "unknown";

const IN_STOCK_TOKENS = [
  "in stock",
  "in_stock",
  "instock",
  "en stock",
  "en_stock",
  "disponible",
  "available",
  "available now",
  "yes",
  "true",
  "1",
];

const OUT_OF_STOCK_TOKENS = [
  "out of stock",
  "out_of_stock",
  "outofstock",
  "rupture",
  "rupture de stock",
  "indisponible",
  "unavailable",
  "sold out",
  "soldout",
  "no",
  "false",
  "0",
];

// Pre-order / back-order — sellable, but not shippable today.
// Kept separate from "in stock" so the UI can badge it differently.
const ON_ORDER_TOKENS = [
  "onorder",
  "on order",
  "on_order",
  "onbackorder",
  "on backorder",
  "backorder",
  "back order",
  "preorder",
  "pre-order",
  "pre order",
  "sur commande",
];

function normalize(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function matchesAny(v: string, tokens: string[]): boolean {
  if (tokens.includes(v)) return true;
  for (const t of tokens) {
    if (v.includes(t)) return true;
  }
  return false;
}

/**
 * Four-state availability classification.
 *
 *   in_stock      → definitely buyable now
 *   on_order      → buyable, but ships later
 *   out_of_stock  → not buyable
 *   unknown       → blank or unrecognized; UI should not warn
 */
export function availabilityKind(
  value: string | null | undefined,
): AvailabilityKind {
  const v = normalize(value);
  if (!v) return "unknown";

  if (matchesAny(v, ON_ORDER_TOKENS)) return "on_order";
  if (matchesAny(v, OUT_OF_STOCK_TOKENS)) return "out_of_stock";
  if (matchesAny(v, IN_STOCK_TOKENS)) return "in_stock";
  return "unknown";
}

/**
 * Legacy two-state helper.
 * `on_order` counts as "in stock" here because the product is
 * still buyable — the card adds a separate badge for it.
 * `unknown` also counts as "in stock" so we never falsely warn.
 */
export function isInStock(value: string | null | undefined): boolean {
  const k = availabilityKind(value);
  return k === "in_stock" || k === "on_order" || k === "unknown";
}

/**
 * Legacy three-state label helper.
 */
export function availabilityLabel(
  value: string | null | undefined,
): "in_stock" | "out_of_stock" | "unknown" {
  const k = availabilityKind(value);
  if (k === "in_stock" || k === "on_order") return "in_stock";
  if (k === "out_of_stock") return "out_of_stock";
  return "unknown";
}

export function parseAvailability(
  value: string | null | undefined,
): boolean | null {
  const k = availabilityKind(value);
  if (k === "in_stock" || k === "on_order") return true;
  if (k === "out_of_stock") return false;
  return null;
}