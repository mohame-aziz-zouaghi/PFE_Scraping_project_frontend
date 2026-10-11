import { api } from "./client";

export interface RecommendedItem {
  product_id: string;
  name: string;
  brand: string | null;
  category: string | null;
  price: number | null;
  discount_price: number | null;
  availability: string | null;
  main_image: string | null;
  url: string;
  site: string;
  rank: number;
  score: number;
  source: string;
  reason: string | null;
}

export interface RecommendationsResponse {
  user_id: string | null;
  cold_start: boolean;
  cached: boolean;
  count: number;
  items: RecommendedItem[];
}

export interface SimilarProductsResponse {
  query_product_id: string;
  count: number;
  items: RecommendedItem[];
}

export async function getForMe(
  limit = 12,
): Promise<RecommendationsResponse> {
  return api.get<RecommendationsResponse>("/recommendations/for-me", {
    query: { limit },
  });
}

export async function getSimilar(
  productId: string,
  limit = 8,
): Promise<SimilarProductsResponse> {
  return api.get<SimilarProductsResponse>(
    `/recommendations/similar/${productId}`,
    { query: { limit } },
  );
}