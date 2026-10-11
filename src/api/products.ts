import { api } from "./client";
import { z } from "zod";
import { uuidSchema } from "@/lib/validation";

// ═══════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════
export interface ProductSummary {
  id: string;
  site: string;
  main_product_id: string | null;
  special_id: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  price: number | null;
  discount_price: number | null;
  discount_amount: number | null;
  availability: string | null;
  url: string;
  main_image: string | null;
  last_updated_at: string | null;
  last_checked: string | null;
}

export interface ProductDetail extends ProductSummary {
  price_valid_until: string | null;
  description: string | null;
  short_description: unknown | null;
  images: unknown | null;
  is_enabled: boolean | null;

  monitoring_priority: number | null;
  monitoring_group: string | null;
  next_check_at: string | null;
  check_failures: number | null;
  consecutive_errors: number | null;
  total_checks: number | null;
  total_errors: number | null;

  last_price_change: string | null;
  price_change_count: number | null;
  price_change_percent: number | null;
  price_volatility_score: number | null;
  avg_price: number | null;
  min_price: number | null;
  max_price: number | null;
  price_trend: string | null;
  change_frequency_7d: number | null;
  change_frequency_30d: number | null;
  days_since_last_change: number | null;

  availability_change_count: number | null;
  last_availability_change: string | null;

  canonical_id: string | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  requires_auth?: boolean;
  auth_reason?: string | null;
}

// ═══════════════════════════════════════════════════════
// Query
// ═══════════════════════════════════════════════════════
export interface ListProductsParams {
  page?: number;
  page_size?: number;
  site?: string;
  brand?: string;
  category?: string;
  availability?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: "name" | "price" | "brand" | "category" | "last_updated_at";
  sort_order?: "asc" | "desc";
}

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  site: z.string().trim().max(50).optional(),
  brand: z.string().trim().max(200).optional(),
  category: z.string().trim().max(200).optional(),
  availability: z.string().trim().max(50).optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  sort_by: z
    .enum(["name", "price", "brand", "category", "last_updated_at"])
    .optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),
});

export async function listProducts(
  params: ListProductsParams = {},
): Promise<Paginated<ProductSummary>> {
  const parsed = listQuerySchema.parse(params);
  const query: Record<string, string | number | undefined> = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (v !== undefined) query[k] = v as string | number;
  }
  return api.get<Paginated<ProductSummary>>("/products", { query });
}

export async function getProduct(id: string): Promise<ProductDetail> {
  return api.get<ProductDetail>(`/products/${uuidSchema.parse(id)}`);
}