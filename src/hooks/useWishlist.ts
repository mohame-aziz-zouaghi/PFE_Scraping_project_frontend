import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getWishlist,
  getWishlistIds,
  toggleWishlist,
} from "@/api/wishlist";
import { useAuth } from "@/hooks/useAuth";

export const WISHLIST_IDS_KEY = ["wishlist", "ids"] as const;
export const WISHLIST_FULL_KEY = ["wishlist", "full"] as const;

/**
 * Wishlist state — hearts, count, toggle.
 *
 * Two queries are cached:
 *   - `ids`   : lightweight Set of product_ids for painting hearts
 *   - `full`  : the `/wishlist` page's full list with snapshots
 *
 * Both are invalidated on every toggle so any page that mounted
 * with the old state re-renders correctly.
 */
export function useWishlist() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const idsQuery = useQuery({
    queryKey: WISHLIST_IDS_KEY,
    queryFn: getWishlistIds,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const fullQuery = useQuery({
    queryKey: WISHLIST_FULL_KEY,
    queryFn: getWishlist,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const ids = new Set(idsQuery.data?.product_ids ?? []);
  const count = fullQuery.data?.count ?? ids.size;

  const toggle = useMutation({
    mutationFn: (product_id: string) => toggleWishlist(product_id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: WISHLIST_IDS_KEY });
      void qc.invalidateQueries({ queryKey: WISHLIST_FULL_KEY });
    },
  });

  return {
    ids,
    count,
    isLoading: idsQuery.isLoading,
    isWishlisted: (product_id: string) => ids.has(product_id),
    toggle: toggle.mutateAsync,
    toggling: toggle.isPending,
    full: fullQuery.data,
    fullLoading: fullQuery.isLoading,
  };
}