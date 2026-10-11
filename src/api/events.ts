import { api } from "./client";
import { env } from "@/lib/env";

export type EventType =
  | "view"
  | "click"
  | "dwell"
  | "wishlist"
  | "add_to_cart";

export interface SignalEvent {
  type: EventType;
  product_id: string;
  ts?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface EventsBatchResponse {
  accepted: number;
  rejected: number;
  errors: Array<Record<string, unknown>>;
}

/** Immediate batch send. Reqires authentication. */
export async function logEvents(
  events: SignalEvent[],
  sessionId?: string,
): Promise<EventsBatchResponse> {
  return api.post<EventsBatchResponse>(
    "/recommendations/events",
    {
      session_id: sessionId ?? getSessionId(),
      events: events.map((e) => ({
        ...e,
        ts: e.ts ?? new Date().toISOString(),
      })),
    },
  );
}

/**
 * Fire-and-forget beacon. `sendBeacon` cannot attach Authorization
 * headers, so the backend receives this as anonymous. We only use it
 * for events where losing authentication is fine (dwell timers on
 * unmount, pagehide flush). If you need authenticated beacons, switch
 * to a synchronous fetch with keepalive.
 */
export function beaconEvent(event: SignalEvent): void {
  if (!navigator.sendBeacon) {
    // Fallback: fetch with keepalive (works in modern browsers).
    void fetch(`${env.apiBaseUrl}/recommendations/events`, {
      method: "POST",
      body: JSON.stringify({
        session_id: getSessionId(),
        events: [
          { ...event, ts: event.ts ?? new Date().toISOString() },
        ],
      }),
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      keepalive: true,
    }).catch(() => {
      // best-effort
    });
    return;
  }
  try {
    const body = JSON.stringify({
      session_id: getSessionId(),
      events: [
        { ...event, ts: event.ts ?? new Date().toISOString() },
      ],
    });
    navigator.sendBeacon(
      `${env.apiBaseUrl}/recommendations/events`,
      new Blob([body], { type: "application/json" }),
    );
  } catch {
    // best-effort
  }
}

// ═══════════════════════════════════════════════════════
// Session id — one per browser tab, stable for its lifetime
// ═══════════════════════════════════════════════════════
const SESSION_KEY = "pm_session_id";

function randomId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = randomId();
    sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return randomId();
  }
}