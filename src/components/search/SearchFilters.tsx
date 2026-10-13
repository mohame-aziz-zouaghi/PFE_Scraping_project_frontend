import SiteBadge from "@/components/product/SiteBadge";
import { SITES, AVAILABILITY_FILTER_OPTIONS } from "@/lib/availability";
import type { SearchFilterState } from "./searchFilterTypes";

const BUDGET_MIN = 0;
const BUDGET_MAX = 5000;

export default function SearchFilters({
  filters,
  onChange,
  onReset,
}: {
  filters: SearchFilterState;
  onChange: (next: Partial<SearchFilterState>) => void;
  onReset: () => void;
}) {
  const minValue =
    filters.minPrice === "" ? BUDGET_MIN : Number(filters.minPrice);
  const maxValue =
    filters.maxPrice === "" ? BUDGET_MAX : Number(filters.maxPrice);

  const handleRange = (which: "min" | "max", value: number) => {
    if (which === "min") {
      onChange({ minPrice: value });
    } else {
      onChange({ maxPrice: value });
    }
  };

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
            Budget (DT)
          </h3>

          <div className="flex items-center gap-2 mb-3">
            <input
              type="number"
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) =>
                onChange({
                  minPrice:
                    e.target.value === "" ? "" : Number(e.target.value),
                })
              }
              className="w-full text-sm rounded-base border border-border-strong bg-surface-elevated text-text-primary px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <span className="text-text-muted text-sm">–</span>
            <input
              type="number"
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) =>
                onChange({
                  maxPrice:
                    e.target.value === "" ? "" : Number(e.target.value),
                })
              }
              className="w-full text-sm rounded-base border border-border-strong bg-surface-elevated text-text-primary px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              step={10}
              value={minValue}
              onChange={(e) => handleRange("min", Number(e.target.value))}
              className="w-full accent-brand-600"
            />
            <input
              type="range"
              min={BUDGET_MIN}
              max={BUDGET_MAX}
              step={10}
              value={maxValue}
              onChange={(e) => handleRange("max", Number(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>
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
          <div className="space-y-2">
            {AVAILABILITY_FILTER_OPTIONS.map((opt) => (
              <label
                key={opt.value || "any"}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="radio"
                  name="availability"
                  checked={filters.availability === opt.value}
                  onChange={() => onChange({ availability: opt.value })}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <span className="text-text-secondary">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}