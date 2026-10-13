import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  textSearch,
  suggestions as fetchSuggestions,
  type SearchResponse,
} from "@/api/search";
import { getSessionId } from "@/api/events";
import { searchQuerySchema } from "@/lib/validation";
import ProductGrid from "@/components/product/ProductGrid";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Pagination from "@/components/ui/Pagination";
import Highlighted from "@/components/search/Highlighted";
import SearchFilters from "@/components/search/SearchFilters";
import {
  DEFAULT_SEARCH_FILTERS,
  type SearchFilterState,
} from "@/components/search/searchFilterTypes";
import type { ProductSummary } from "@/api/products";
import { useClickLogger } from "@/hooks/useEventLogger";

const PAGE_SIZE = 25;

function toProductSummary(r: {
  product_id: string;
  site: string;
  name: string;
  brand: string | null;
  category: string | null;
  price: number;
  availability: string;
  main_image: string | null;
  url: string;
}): ProductSummary {
  return {
    id: r.product_id,
    site: r.site,
    main_product_id: null,
    special_id: null,
    name: r.name,
    brand: r.brand,
    category: r.category,
    price: r.price,
    discount_price: null,
    discount_amount: null,
    availability: r.availability,
    url: r.url,
    main_image: r.main_image,
    last_updated_at: null,
    last_checked: null,
  };
}

export default function Search() {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [inputError, setInputError] = useState<string | undefined>();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SearchFilterState>(
    DEFAULT_SEARCH_FILTERS,
  );
  const blurTimeout = useRef<number | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const logClick = useClickLogger();

  const searchQuery = useQuery<SearchResponse>({
    queryKey: ["search", submitted, page, filters],
    queryFn: () =>
      textSearch({
        query: submitted,
        ...(filters.site ? { site: filters.site } : {}),
        ...(filters.availability
          ? { availability: filters.availability }
          : {}),
        ...(filters.minPrice !== ""
          ? { min_price: Number(filters.minPrice) }
          : {}),
        ...(filters.maxPrice !== ""
          ? { max_price: Number(filters.maxPrice) }
          : {}),
        page,
        page_size: PAGE_SIZE,
        sort_by: "relevance",
        session_id: getSessionId(),
      }),
    enabled: submitted.length > 0,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const suggestQuery = useQuery({
    queryKey: ["search", "suggest", input],
    queryFn: () => fetchSuggestions(input, 8),
    enabled: input.length >= 2 && input !== submitted,
    staleTime: 60_000,
  });

  useEffect(() => {
    return () => {
      if (blurTimeout.current !== null) {
        window.clearTimeout(blurTimeout.current);
      }
    };
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    try {
      const validated = searchQuerySchema.parse(input);
      setInputError(undefined);
      setSubmitted(validated);
      setPage(1);
      setShowSuggestions(false);
    } catch (err) {
      setInputError(
        err instanceof Error ? err.message : "Invalid search query",
      );
    }
  };

  const pickSuggestion = (text: string) => {
    setInput(text);
    setSubmitted(text);
    setPage(1);
    setShowSuggestions(false);
    setInputError(undefined);
  };

  const handleFilterChange = (next: Partial<SearchFilterState>) => {
    setFilters((f) => ({ ...f, ...next }));
    setPage(1);
  };

  const handleReset = () => {
    setFilters(DEFAULT_SEARCH_FILTERS);
    setPage(1);
  };

  const handlePageChange = (next: number) => {
    setPage(next);
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const products: ProductSummary[] = useMemo(
    () => (searchQuery.data?.items ?? []).map(toProductSummary),
    [searchQuery.data],
  );

  const totalPages = searchQuery.data?.total_pages ?? 1;

  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      <header className="flex flex-col items-center text-center pt-4 pb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
          Search products
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Find products, brands, and categories across all retailers
        </p>

        <form
          onSubmit={onSubmit}
          className="relative w-full max-w-2xl mt-6"
        >
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Search products, brands, categories..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  blurTimeout.current = window.setTimeout(
                    () => setShowSuggestions(false),
                    150,
                  );
                }}
                error={inputError}
                autoComplete="off"
              />

              {showSuggestions &&
                suggestQuery.data &&
                suggestQuery.data.items.length > 0 && (
                  <ul className="absolute z-20 top-full left-0 right-0 mt-1 bg-surface-elevated border border-border-subtle rounded-base shadow-lg overflow-hidden text-left">
                    {suggestQuery.data.items.map((s, i) => (
                      <li key={`${s.type}-${s.text}-${i}`}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickSuggestion(s.text)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface flex items-center justify-between gap-3"
                        >
                          <span className="truncate">
                            <span className="text-text-muted text-xs uppercase mr-2">
                              {s.type}
                            </span>
                            <Highlighted text={s.text} query={input} />
                          </span>
                          {s.count !== null && (
                            <span className="text-xs text-text-muted shrink-0">
                              {s.count}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
            <Button type="submit" size="md">
              Search
            </Button>
          </div>
        </form>
      </header>

      <div className="flex gap-6 lg:gap-8">
        <SearchFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
        />

        <div className="flex-1 min-w-0 space-y-6" ref={resultsRef}>
          {searchQuery.isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface-elevated rounded-base border border-border-subtle aspect-[3/4] animate-pulse"
                />
              ))}
            </div>
          )}

          {searchQuery.isError && (
            <ErrorState
              message={
                searchQuery.error instanceof Error
                  ? searchQuery.error.message
                  : "Search failed"
              }
              onRetry={() => searchQuery.refetch()}
            />
          )}

          {searchQuery.data && searchQuery.data.items.length === 0 && (
            <EmptyState
              title="No results"
              description={`Nothing matched "${submitted}" with the current filters.`}
            />
          )}

          {searchQuery.data && searchQuery.data.items.length > 0 && (
            <>
              <p className="text-sm text-text-muted">
                {searchQuery.data.total}{" "}
                {searchQuery.data.total === 1 ? "result" : "results"} for{" "}
                <Highlighted
                  text={`"${searchQuery.data.query}"`}
                  query={submitted}
                  className="text-text-primary font-medium"
                />{" "}
                <span className="text-xs">
                  ({searchQuery.data.took_ms.toFixed(0)} ms)
                </span>
              </p>

              <ProductGrid
                products={products}
                onCardClick={(p, i) => logClick(p.id, "search", i)}
                highlightQuery={submitted}
              />

              <div className="pt-4 border-t border-border-subtle">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onChange={handlePageChange}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}