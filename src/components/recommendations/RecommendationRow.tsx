import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";

export default function RecommendationRow({
  title,
  subtitle,
  children,
  empty,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  empty?: boolean;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const left = el.scrollLeft > 4;
    const right =
      el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setCanScrollLeft(left);
    setCanScrollRight(right);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, children]);

  const scrollBy = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(320, el.clientWidth * 0.8);
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (empty) return null;

  return (
    <section className={clsx("space-y-4", className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-text-muted mt-1">{subtitle}</p>
          )}
        </div>

        {/* Chevron controls — hidden on touch, useful on desktop */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollBy("left")}
            disabled={!canScrollLeft}
            className={clsx(
              "w-9 h-9 rounded-full flex items-center justify-center",
              "border border-border-subtle bg-surface-elevated",
              "transition-all duration-150",
              canScrollLeft
                ? "hover:border-brand-500 hover:text-brand-600 text-text-secondary"
                : "opacity-40 cursor-not-allowed",
            )}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollBy("right")}
            disabled={!canScrollRight}
            className={clsx(
              "w-9 h-9 rounded-full flex items-center justify-center",
              "border border-border-subtle bg-surface-elevated",
              "transition-all duration-150",
              canScrollRight
                ? "hover:border-brand-500 hover:text-brand-600 text-text-secondary"
                : "opacity-40 cursor-not-allowed",
            )}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className={clsx(
          "flex gap-4 overflow-x-auto snap-x snap-mandatory",
          "scrollbar-hide pb-2",
        )}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {children}
      </div>
    </section>
  );
}