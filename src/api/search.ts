import { api } from "./client";

export interface SearchResult {
  product_id: string;
  site: string;
  name: string;
  brand: string | null;
  category: string | null;
  price: number;
  availability: string;
  main_image: string | null;
  url: string;
  score: number;
}

export interface SearchResponse {
  query: string;
  items: SearchResult[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  took_ms: number;
}

export interface TextSearchRequest {
  query: string;
  site?: string;
  brand?: string;
  category?: string;
  availability?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  page_size?: number;
  sort_by?: "relevance" | "price" | "price_desc" | "recent";
  session_id?: string;  
}

export interface SemanticSearchRequest {
  query: string;
  site?: string;
  limit?: number;
  min_similarity?: number;
}

export interface SuggestionItem {
  text: string;
  type: "product" | "brand" | "category";
  count: number | null;
}

export interface SuggestionsResponse {
  query: string;
  items: SuggestionItem[];
}

export async function textSearch(
  payload: TextSearchRequest,
): Promise<SearchResponse> {
  return api.post<SearchResponse>("/search/text", payload);
}

export async function semanticSearch(
  payload: SemanticSearchRequest,
): Promise<SearchResponse> {
  return api.post<SearchResponse>("/search/semantic", payload);
}

export async function suggestions(
  q: string,
  limit = 8,
): Promise<SuggestionsResponse> {
  return api.get<SuggestionsResponse>("/search/suggestions", {
    query: { q, limit },
  });
}