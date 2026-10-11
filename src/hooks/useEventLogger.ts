/**
 * Client-side signal collection.
 *
 * Only active for authenticated users. All events are silently
 * dropped if the user is anonymous.
 *
 * Events are queued in memory and flushed every 10 seconds OR when
 * the queue reaches 20 items. Dwell events are fired on unmount via
 * sendBeacon so they survive navigation. Pagehide also flushes the
 * queue via sendBeacon.
 */
import { useEffect, useRef } from "react";
import {
  beaconEvent,
  logEvents,
  type EventType,
  type SignalEvent,
} from "@/api/events";
import { useAuth } from "@/hooks/useAuth";

// ═══════════════════════════════════════════════════════
// Global queue — shared across all hook instances on a page
// ═══════════════════════════════════════════════════════
const queue: SignalEvent[] = [];
let flushTimer: number | null = null;
let flushInFlight = false;

const FLUSH_INTERVAL_MS = 10_000;
const FLUSH_THRESHOLD = 20;
const MAX_QUEUE = 200;

let isAuthenticated = false;

/**
 * Called from useAuth whenever the auth status changes. Keeps the
 * module-level flag in sync so events stop being queued the moment
 * a user logs out.
 */
export function __setAuthFlag(value: boolean): void {
  isAuthenticated = value;
}

function scheduleFlush(): void {
  if (flushTimer !== null) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flush();
  }, FLUSH_INTERVAL_MS);
}

async function flush(): Promise<void> {
  if (flushInFlight || queue.length === 0) return;
  if (!isAuthenticated) {
    // Drop everything if the user logged out mid-flight.
    queue.length = 0;
    return;
  }
  flushInFlight = true;
  const batch = queue.splice(0, queue.length);
  try {
    await logEvents(batch);
  } catch {
    // Re-queue on failure but cap the queue so memory stays bounded.
    const room = Math.max(0, MAX_QUEUE - queue.length);
    queue.unshift(...batch.slice(0, room));
  } finally {
    flushInFlight = false;
    if (queue.length >= FLUSH_THRESHOLD) void flush();
  }
}

function enqueue(event: SignalEvent): void {
  if (!isAuthenticated) return;
  queue.push(event);
  if (queue.length >= FLUSH_THRESHOLD) {
    void flush();
  } else {
    scheduleFlush();
  }
}

// ═══════════════════════════════════════════════════════
// Hooks
// ═══════════════════════════════════════════════════════

/**
 * Product-detail view logger. Fires a `view` on mount and a
 * `dwell` on unmount (if the user stayed >2 seconds).
 */
export function useViewLogger(
  productId: string | null | undefined,
): void {
  const { isAuthenticated: authed } = useAuth();
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!authed || !productId) return;
    startedAt.current = Date.now();

    enqueue({
      type: "view",
      product_id: productId,
      metadata: {
        referrer: document.referrer
          ? new URL(document.referrer).hostname
          : "",
      },
    });

    return () => {
      const start = startedAt.current;
      if (start == null) return;
      const seconds = Math.round((Date.now() - start) / 1000);
      if (seconds < 2) return;
      // Dwell fires via beacon so it survives navigation.
      beaconEvent({
        type: "dwell",
        product_id: productId,
        metadata: { seconds },
      });
    };
  }, [authed, productId]);
}

/**
 * Logs a click on a product card / list item. Queued, not immediate.
 */
export function useClickLogger() {
  const { isAuthenticated: authed } = useAuth();
  return (
    productId: string,
    source: "home" | "products" | "search" | "similar",
    position?: number,
  ) => {
    if (!authed) return;
    enqueue({
      type: "click",
      product_id: productId,
      metadata: {
        source,
        ...(position !== undefined ? { position } : {}),
      },
    });
  };
}

/**
 * Logs wishlist / add-to-cart events. Immediate — these are high-signal
 * and we want them persisted even if the tab closes right after.
 */
export function useActionLogger() {
  const { isAuthenticated: authed } = useAuth();
  return (event: {
    type: Extract<EventType, "wishlist" | "add_to_cart">;
    product_id: string;
    qty?: number;
  }) => {
    if (!authed) return;

    // Build the payload with the conditional spread so `metadata`
    // is only present when there's data. Satisfies
    // exactOptionalPropertyTypes.
    const payload: SignalEvent = {
      type: event.type,
      product_id: event.product_id,
      ...(event.qty !== undefined
        ? { metadata: { qty: event.qty } }
        : {}),
    };

    void logEvents([payload]).catch(() => {
      enqueue(payload);
    });
  };
}

/**
 * Generic immediate-logger for callers that don't want to
 * `await` anything themselves.
 */
export function useImmediateEvent() {
  const { isAuthenticated: authed } = useAuth();
  return (event: SignalEvent) => {
    if (!authed) return;
    void logEvents([event]).catch(() => {
      enqueue(event);
    });
  };
}

// ═══════════════════════════════════════════════════════
// Global unload flush — installed once per page load
// ═══════════════════════════════════════════════════════
if (typeof window !== "undefined") {
  const flushOnUnload = () => {
    if (!isAuthenticated || queue.length === 0) return;
    for (const e of queue.splice(0, queue.length)) {
      beaconEvent(e);
    }
  };
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushOnUnload();
  });
  window.addEventListener("pagehide", flushOnUnload);
}