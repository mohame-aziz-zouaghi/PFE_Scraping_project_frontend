export default function Stars({
  rating,
  size = 16,
  className = "",
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const rounded = rating - full >= 0.75 ? full + 1 : full;

  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const isFull = i < rounded;
        const isHalf = i === full && hasHalf;
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            className={
              isFull || isHalf
                ? "text-amber-400"
                : "text-neutral-300 dark:text-neutral-500"
            }
            aria-hidden="true"
          >
            {isHalf ? (
              <defs>
                <linearGradient id={`half-${i}`}>
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" stopOpacity="1" />
                </linearGradient>
              </defs>
            ) : null}
            <path
              d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36-1.754-4.17Z"
              fill={isHalf ? `url(#half-${i})` : "currentColor"}
              stroke={isHalf ? "currentColor" : "none"}
              strokeWidth={isHalf ? 1 : 0}
            />
          </svg>
        );
      })}
    </div>
  );
}