// src/api/compare.ts
import { api } from "./client";

export interface GroupListing {
  product_id: string;
  site: string;
  main_product_id: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  price: number | null;
  discount_price: number | null;
  discount_amount: number | null;
  availability: string | null;
  url: string;
  main_image: string | null;
  last_checked: string | null;
  effective_price: number | null;
}

export interface GroupDetail {
  group_id: string;
  canonical_name: string;
  canonical_brand: string | null;
  canonical_category: string | null;
  variant_signature: Record<string, unknown> | null;
  product_count: number;
  site_count: number;
  confidence: number;
  base_group_id: string | null;
  cheapest_site: string | null;
  cheapest_price: number | null;
  most_expensive_price: number | null;
  savings_amount: number | null;
  savings_percent: number | null;
  listings: GroupListing[];
}

export interface VariantInBase {
  group_id: string;
  canonical_name: string;
  variant_signature: Record<string, unknown> | null;
  product_count: number;
  site_count: number;
  cheapest_price: number | null;
  cheapest_site: string | null;
}

export interface BaseGroupDetail {
  base_group_id: string;
  base_name: string;
  base_brand: string | null;
  base_category: string | null;
  variant_count: number;
  site_count: number;
  total_product_count: number;
  overall_cheapest_price: number | null;
  overall_cheapest_site: string | null;
  variants: VariantInBase[];
}

export interface ProductGroupResponse {
  product_id: string;
  group_id: string | null;
  base_group_id: string | null;
  canonical_name: string | null;
  site_count: number;
  listings: GroupListing[];
}

export async function getProductGroup(
  productId: string,
): Promise<ProductGroupResponse> {
  return api.get<ProductGroupResponse>(`/compare/product/${productId}`);
}

export async function getGroupDetail(
  canonicalId: string,
): Promise<GroupDetail> {
  return api.get<GroupDetail>(`/compare/group/${canonicalId}`);
}

export async function getBaseGroupDetail(
  baseId: string,
): Promise<BaseGroupDetail> {
  return api.get<BaseGroupDetail>(`/compare/base/${baseId}`);
}

/** Effective price for a listing: discount if > 0, else regular. */
export function effectivePriceForListing(
  listing: GroupListing,
): number | null {
  if (listing.effective_price != null) return listing.effective_price;
  const dp = listing.discount_price ?? 0;
  if (dp > 0) return dp;
  return listing.price ?? null;
}