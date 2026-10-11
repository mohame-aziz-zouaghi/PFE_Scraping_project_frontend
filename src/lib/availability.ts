/**
 * Availability normalization.
 *
 * The scraper writes site-native values. This module maps them to a single
 * boolean so UI code doesn't have to guess. Extend the "in stock" set here
 * whenever a new site's vocabulary appears.
 *
 * Real values seen in this project (extend as needed):
 *   tunisianet:  "En Stock" / "Rupture de stock" / "Disponible"
 *   megapc:      "in stock" / "out of stock"
 *   sbs:         "Disponible" / "Indisponible"
 *   mytek:       "En stock" / "Rupture"
 *   spacenet:    "Disponible" / "Rupture"
 *   skymil:      "available" / "unavailable"
 */

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

function normalize(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Returns:
 *   true  → product is definitely in stock
 *   false → product is definitely out of stock
 *   null  → the value is unknown/blank, so the UI should NOT assume out of stock
 *
 * Prefer the "in stock tokens" match first, then the "out of stock" tokens,
 * else fall back to a substring check.
 */
export function parseAvailability(
  value: string | null | undefined,
): boolean | null {
  const v = normalize(value);
  if (!v) return null;

  if (IN_STOCK_TOKENS.includes(v)) return true;
  if (OUT_OF_STOCK_TOKENS.includes(v)) return false;

  // Substring fallback — catches "Usually available in 2 days" etc.
  for (const token of OUT_OF_STOCK_TOKENS) {
    if (v.includes(token)) return false;
  }
  for (const token of IN_STOCK_TOKENS) {
    if (v.includes(token)) return true;
  }

  // Unknown vocabulary — do NOT claim out of stock.
  return null;
}

/**
 * Convenience for components that render an "out of stock" overlay.
 * Treats `null` (unknown) as in stock so we never falsely warn the user.
 */
export function isInStock(value: string | null | undefined): boolean {
  const parsed = parseAvailability(value);
  return parsed !== false;   // true or null → considered in stock
}

/**
 * For badges that want a three-state display.
 */
export function availabilityLabel(
  value: string | null | undefined,
): "in_stock" | "out_of_stock" | "unknown" {
  const parsed = parseAvailability(value);
  if (parsed === true) return "in_stock";
  if (parsed === false) return "out_of_stock";
  return "unknown";
}