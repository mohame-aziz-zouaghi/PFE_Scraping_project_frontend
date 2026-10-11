export default function SkeletonCard() {
  return (
    <div
      role="status"
      aria-label="Loading product"
      className="flex flex-col w-full bg-surface-elevated border border-border-subtle rounded-base shadow-xs overflow-hidden animate-pulse"
    >
      {/* Image block */}
      <div className="aspect-square bg-neutral-200 dark:bg-neutral-300 flex items-center justify-center">
        <svg
          className="w-12 h-12 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
      </div>

      <div className="flex flex-col gap-3 p-4 sm:p-5">
        {/* Site + rating row */}
        <div className="flex items-center justify-between gap-2">
          <div className="h-5 w-16 rounded-full bg-neutral-200 dark:bg-neutral-300" />
          <div className="h-4 w-20 rounded bg-neutral-200 dark:bg-neutral-300" />
        </div>

        {/* Title lines */}
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-300" />
          <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-300" />
        </div>

        {/* Brand / category */}
        <div className="h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-300" />

        {/* Price + CTA */}
        <div className="flex items-end justify-between gap-3 pt-2 mt-auto">
          <div className="space-y-1.5">
            <div className="h-6 w-20 rounded bg-neutral-200 dark:bg-neutral-300" />
            <div className="h-3 w-12 rounded bg-neutral-200 dark:bg-neutral-300" />
          </div>
          <div className="h-10 w-20 rounded-base bg-neutral-200 dark:bg-neutral-300" />
        </div>
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  );
}