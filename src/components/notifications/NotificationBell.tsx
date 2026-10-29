// src/components/notifications/NotificationBell.tsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useNotificationStore } from "@/store/notifications";
import type { NotificationRow } from "./types";

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return "just now";
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatPrice(n: number | null): string {
  if (n === null) return "";
  return `${n.toLocaleString("fr-TN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} DT`;
}

function formatDiscount(pct: number | null): string {
  if (pct === null) return "";
  const sign = pct < 0 ? "" : "+";
  return `${sign}${pct.toFixed(0)}%`;
}

function KindBubble({ kind }: { kind: NotificationRow["kind"] }) {
  const isPrice = kind === "price_alert";
  return (
    <div
      className={[
        "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
        isPrice ? "bg-brand text-white" : "bg-warning text-white",
      ].join(" ")}
      aria-hidden="true"
    >
      {isPrice ? (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v7m0 0-3-3m3 3 3-3" />
        </svg>
      ) : (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3.5 8 12 3.5 20.5 8 12 12.5 3.5 8Z" />
          <path d="M3.5 8v8L12 20.5V12.5" />
          <path d="M20.5 8v8L12 20.5" />
        </svg>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-secondary-medium">
        <svg
          className="h-7 w-7 text-text-secondary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-heading">
        You're all caught up
      </p>
      <p className="mt-1 text-xs text-text-secondary">
        We'll let you know when prices drop or items come back in stock.
      </p>
    </div>
  );
}

export function NotificationBell() {
  const items = useNotificationStore((s) => s.recent);
  const unreadCount = useNotificationStore((s) => s.unread);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const markOneRead = useNotificationStore((s) => s.markOneRead);

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Delegate to store — the store does the API call, so the
  // component never has to know about URLs or tokens.
  const handleMarkAllRead = () => {
    void markAllRead();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        id="dropdownNotificationButton"
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="dropdownNotification"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        onClick={() => setOpen((v) => !v)}
        className={[
          "relative inline-flex h-9 w-9 items-center justify-center rounded-md",
          "transition-colors focus:outline-none focus-visible:ring-2",
          "focus-visible:ring-brand-600",
          unreadCount > 0
            ? "bg-brand text-white hover:bg-brand-700 shadow-sm"
            : "text-text-secondary hover:bg-surface-overlay hover:text-brand-700",
        ].join(" ")}
      >
        <svg
          className="h-5 w-5"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>

        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className={[
              "absolute -right-1 -top-1 flex items-center justify-center",
              "min-w-[18px] h-[18px] px-1",
              "rounded-full bg-danger-600 text-white",
              "text-[10px] font-bold leading-none",
              "ring-2 ring-surface-elevated",
              "notif-badge-pop",
            ].join(" ")}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <div
        id="dropdownNotification"
        role="menu"
        aria-labelledby="dropdownNotificationButton"
        className={[
          "absolute right-0 z-30 mt-2 w-[380px] max-w-[calc(100vw-1rem)]",
          "overflow-hidden rounded-xl border border-border-subtle bg-surface-elevated shadow-lg",
          open ? "" : "hidden",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-border-subtle bg-neutral-secondary-medium px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-heading">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold leading-none text-white">
                {unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs font-medium text-brand-700 hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        <div
          className="max-h-[400px] divide-y divide-default overflow-y-auto"
          aria-live="polite"
          aria-relevant="additions"
        >
          {items.length === 0 ? (
            <EmptyState />
          ) : (
            items.map((n) => {
              const href = n.product_url || "/notifications";
              const isInternal = href.startsWith("/");

              const content = (
                <>
                  <KindBubble kind={n.kind} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={[
                          "truncate text-sm",
                          n.is_read
                            ? "font-medium text-text-primary"
                            : "font-semibold text-heading",
                        ].join(" ")}
                      >
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span
                          aria-label="Unread"
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand"
                        />
                      )}
                    </div>

                    {n.kind === "price_alert" &&
                    n.old_price !== null &&
                    n.new_price !== null ? (
                      <p className="mt-0.5 text-xs text-text-secondary">
                        <span className="line-through">
                          {formatPrice(n.old_price)}
                        </span>{" "}
                        <span className="font-semibold text-heading">
                          {formatPrice(n.new_price)}
                        </span>
                        {n.discount_pct !== null && (
                          <span className="ml-1.5 font-medium text-danger">
                            {formatDiscount(n.discount_pct)}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="mt-0.5 truncate text-xs text-text-secondary">
                        {n.body}
                      </p>
                    )}

                    <p className="mt-1 text-[11px] text-text-secondary">
                      {relativeTime(n.created_at)}
                    </p>
                  </div>
                </>
              );

              const itemClass = [
                "flex w-full text-left gap-3 px-4 py-3 transition-colors",
                "hover:bg-neutral-secondary-medium focus:bg-neutral-secondary-medium focus:outline-none",
                n.is_read ? "opacity-70" : "",
              ].join(" ");

              const handleClick = () => {
                // Persist to backend AND update local state.
                // Fire-and-forget — the store handles rollback.
                void markOneRead(n.id);
                setOpen(false);
              };

              return isInternal ? (
                <Link
                  key={`${n.kind}-${n.id}`}
                  to={href}
                  role="menuitem"
                  className={itemClass}
                  onClick={handleClick}
                >
                  {content}
                </Link>
              ) : (
                <a
                  key={`${n.kind}-${n.id}`}
                  href={href}
                  role="menuitem"
                  className={itemClass}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleClick}
                >
                  {content}
                </a>
              );
            })
          )}
        </div>

        <Link
          to="/notifications"
          onClick={() => setOpen(false)}
          className="block border-t border-border-subtle bg-neutral-secondary-medium px-4 py-2.5 text-center text-sm font-medium text-brand-700 hover:bg-neutral-tertiary-medium"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}