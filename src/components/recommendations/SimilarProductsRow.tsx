import { useQuery } from "@tanstack/react-query";
import { getSimilar } from "@/api/recommendations";
import { useClickLogger } from "@/hooks/useEventLogger";
import RecommendationRow from "./RecommendationRow";
import RecommendationCard from "./RecommendationCard";

export default function SimilarProductsRow({
  productId,
}: {
  productId: string;
}) {
  const logClick = useClickLogger();

  const query = useQuery({
    queryKey: ["recommendations", "similar", productId],
    queryFn: () => getSimilar(productId, 8),
    staleTime: 5 * 60_000,
  });

  if (query.isLoading) return null;
  if (!query.data || query.data.items.length === 0) return null;

  return (
    <RecommendationRow
      title="Similar products"
      subtitle="Comparable items across the catalog"
    >
      {query.data.items.map((item, i) => (
        <RecommendationCard
          key={item.product_id}
          item={item}
          onClick={() => logClick(item.product_id, "similar", i)}
        />
      ))}
    </RecommendationRow>
  );
}