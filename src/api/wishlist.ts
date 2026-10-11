import { api } from "./client";

export interface WishlistItem {
  product_id: string;
  added_at: string;
  name: string | null;
  brand: string | null;
  category: string | null;
  price: number | null;
  discount_price: number | null;
  main_image: string | null;
  url: string | null;
  site: string | null;
  availability: string | null;
}

export interface WishlistOut {
  count: number;
  items: WishlistItem[];
}

export interface WishlistIdsOut {
  product_ids: string[];
}

export interface WishlistToggleOut {
  in_wishlist: boolean;
}

export async function getWishlist(): Promise<WishlistOut> {
  return api.get<WishlistOut>("/wishlist");
}

export async function getWishlistIds(): Promise<WishlistIdsOut> {
  return api.get<WishlistIdsOut>("/wishlist/ids");
}

export async function toggleWishlist(
  product_id: string,
): Promise<WishlistToggleOut> {
  return api.post<WishlistToggleOut>("/wishlist/toggle", {
    product_id,
  });
}