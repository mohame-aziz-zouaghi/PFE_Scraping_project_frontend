import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getForMe } from "@/api/recommendations";
import { useClickLogger } from "@/hooks/useEventLogger";
import RecommendationRow from "./RecommendationRow";
import RecommendationCard from "./RecommendationCard";

export default function RecommendationsHomeRow() {
  const { isAuthenticated } = useAuth();
  const logClick = useClickLogger();

  const query = useQuery({
    queryKey: ["recommendations", "for-me"],
    queryFn: () => getForMe(15),
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });

  if (!isAuthenticated) return null;
  if (query.isLoading) return null;
  if (!query.data || query.data.items.length === 0) return null;

  return (
    <RecommendationRow
      title={
        query.data.cold_start
          ? "Popular right now"
          : "Recommended for you"
      }
      subtitle={
        query.data.cold_start
          ? "Top picks across all categories"
          : "Based on what you've been browsing"
      }
    >
      {query.data.items.map((item, i) => (
        <RecommendationCard
          key={item.product_id}
          item={item}
          onClick={() => logClick(item.product_id, "home", i)}
        />
      ))}
    </RecommendationRow>
  );
}