export interface SearchFilterState {
  site: string;
  availability: string;
  minPrice: number | "";
  maxPrice: number | "";
}

export const DEFAULT_SEARCH_FILTERS: SearchFilterState = {
  site: "",
  availability: "",
  minPrice: "",
  maxPrice: "",
};