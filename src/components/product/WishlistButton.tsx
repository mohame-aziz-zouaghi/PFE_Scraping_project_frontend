import clsx from "clsx";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";

export default function WishlistButton({
  productId,
  size = "md",
  className,
  onRequireAuth,
}: {
  productId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Called when an anonymous user taps the heart. Typically opens
   *  the sign-in modal or navigates to /login. */
  onRequireAuth?: () => void;
}) {
  const { isAuthenticated } = useAuth();
  const { isWishlisted, toggle } = useWishlist();

  const active = isAuthenticated && isWishlisted(productId);

  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      onRequireAuth?.();
      return;
    }
    void toggle(productId);
  };

  const dim =
    size === "sm" ? "w-7 h-7" : size === "lg" ? "w-11 h-11" : "w-9 h-9";
  const iconDim =
    size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-5 h-5" : "w-4 h-4";

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      className={clsx(
        "inline-flex items-center justify-center rounded-full",
        "border transition-all duration-200",
        "backdrop-blur",
        active
          ? "bg-danger-600 border-danger-600 text-white shadow-sm scale-105"
          : "bg-white/90 dark:bg-neutral-900/80 border-border-subtle text-text-muted hover:text-danger-600 hover:border-danger-500",
        "focus:outline-none focus:ring-4 focus:ring-danger-500/30",
        dim,
        className,
      )}
    >
      <svg
        className={iconDim}
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}