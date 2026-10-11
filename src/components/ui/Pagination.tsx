import clsx from "clsx";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** How many page numbers to show at once, centered on the current page. */
  windowSize?: number;
}

export default function Pagination({
  page,
  totalPages,
  onChange,
  windowSize = 5,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildWindow(page, totalPages, windowSize);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const baseBtn = clsx(
    "flex items-center justify-center",
    "text-sm font-medium",
    "w-9 h-9 sm:w-10 sm:h-10",
    "border border-border-subtle",
    "bg-surface-elevated text-text-secondary",
    "hover:bg-surface hover:text-text-primary",
    "focus:outline-none focus:ring-2 focus:ring-brand-500/30",
    "transition-colors",
  );

  const prevNextClass = clsx(baseBtn);
  const numberClass = clsx(baseBtn);
  const activeClass = clsx(
    "flex items-center justify-center",
    "text-sm font-medium",
    "w-9 h-9 sm:w-10 sm:h-10",
    "border border-border-subtle",
    "bg-surface text-brand-600",
    "focus:outline-none",
    "cursor-default",
  );

  return (
    <nav
      aria-label="Pagination"
      className="flex justify-center"
    >
      <ul className="flex -space-x-px text-sm">
        {/* Previous */}
        <li>
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => canPrev && onChange(page - 1)}
            aria-label="Previous page"
            className={clsx(
              prevNextClass,
              "rounded-s-base",
              !canPrev && "opacity-40 cursor-not-allowed",
            )}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </li>

        {/* Page numbers + ellipsis */}
        {pages.map((p, i) =>
          p === "..." ? (
            <li key={`ellipsis-${i}`}>
              <span
                className={clsx(
                  numberClass,
                  "cursor-default text-text-muted",
                )}
              >
                …
              </span>
            </li>
          ) : p === page ? (
            <li key={p}>
              <span className={activeClass} aria-current="page">
                {p}
              </span>
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => onChange(p)}
                className={numberClass}
              >
                {p}
              </button>
            </li>
          ),
        )}

        {/* Next */}
        <li>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => canNext && onChange(page + 1)}
            aria-label="Next page"
            className={clsx(
              prevNextClass,
              "rounded-e-base",
              !canNext && "opacity-40 cursor-not-allowed",
            )}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </li>
      </ul>
    </nav>
  );
}

/** Build the visible window of page numbers, with ellipsis markers. */
function buildWindow(
  current: number,
  total: number,
  size: number,
): Array<number | "..."> {
  if (total <= size + 2) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const half = Math.floor(size / 2);
  let start = Math.max(2, current - half);
  let end = Math.min(total - 1, current + half);

  // If near the ends, stretch the window to fill `size` slots.
  if (current - half <= 2) {
    start = 2;
    end = Math.min(total - 1, size);
  }
  if (current + half >= total - 1) {
    end = total - 1;
    start = Math.max(2, total - size + 1);
  }

  const out: Array<number | "..."> = [1];
  if (start > 2) out.push("...");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("...");
  out.push(total);
  return out;
}