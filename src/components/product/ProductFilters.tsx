import SiteBadge from "./SiteBadge";

export interface Filters {
  site: string;
  brand: string;
  category: string;
  availability: string;
  sort_by: "name" | "price" | "brand" | "category" | "last_updated_at";
  sort_order: "asc" | "desc";
}

export const SITES = [
  "megapc",
  "tunisianet",
  "sbs",
  "mytek",
  "spacenet",
  "skymil",
];

export const AVAILABILITIES = ["in_stock", "out_of_stock"];

export default function ProductFilters({
  filters,
  onChange,
  onReset,
}: {
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  onReset: () => void;
}) {
  return (
    <aside className="hidden lg:block w-72 shrink-0">
      <div className="sticky top-24 space-y-6 rounded-base border border-border-subtle bg-surface-elevated p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Filters</h2>
          <button
            onClick={onReset}
            className="text-xs text-brand-600 hover:text-brand-700 hover:underline"
          >
            Reset
          </button>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Site
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="site"
                checked={filters.site === ""}
                onChange={() => onChange({ site: "" })}
                className="text-brand-600 focus:ring-brand-500"
              />
              <span className="text-text-secondary">All sites</span>
            </label>
            {SITES.map((s) => (
              <label
                key={s}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="radio"
                  name="site"
                  checked={filters.site === s}
                  onChange={() => onChange({ site: s })}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <SiteBadge site={s} />
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Availability
          </h3>
          <select
            value={filters.availability}
            onChange={(e) => onChange({ availability: e.target.value })}
            className="w-full text-sm rounded-base border border-border-strong bg-surface-elevated text-text-primary px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Any</option>
            {AVAILABILITIES.map((a) => (
              <option key={a} value={a}>
                {a.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Sort
          </h3>
          <select
            value={`${filters.sort_by}:${filters.sort_order}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split(":") as [
                Filters["sort_by"],
                Filters["sort_order"],
              ];
              onChange({ sort_by: by, sort_order: order });
            }}
            className="w-full text-sm rounded-base border border-border-strong bg-surface-elevated text-text-primary px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="last_updated_at:desc">Newest</option>
            <option value="price:asc">Price: low to high</option>
            <option value="price:desc">Price: high to low</option>
            <option value="name:asc">Name A-Z</option>
          </select>
        </div>
      </div>
    </aside>
  );
}