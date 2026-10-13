export interface Filters {
  site: string;
  brand: string;
  category: string;
  availability: string;
  sort_by: "name" | "price" | "brand" | "category" | "last_updated_at";
  sort_order: "asc" | "desc";
}