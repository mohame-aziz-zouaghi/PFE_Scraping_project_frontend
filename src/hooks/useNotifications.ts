// src/hooks/useNotifications.ts
import { useEffect, useRef } from "react";
import { tokenStore } from "@/lib/http";
import { useAuthStore } from "@/store/auth";
import { useNotificationStore } from "@/store/notifications";
import type { NotificationRow } from "@/components/notifications/types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const WS_BASE = (() => {
  const explicit = import.meta.env.VITE_WS_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (API_BASE) return API_BASE.replace(/^http/, "ws");
  return window.location.protocol === "https:"
    ? `wss://${window.location.host}`
    : `ws://${window.location.host}`;
})();

const RECONNECT_MIN_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const WS_CLOSE_UNAUTHORIZED = 4401;

function stripBearer(t: unknown): string | null {
  if (typeof t !== "string" || !t) return null;
  return t.replace(/^Bearer\s+/i, "");
}

/**
 * Subscribe to `tokenStore` so the WS effect re-runs whenever
 * the JWT changes — on login, on refresh rotation, on logout.
 */
function useAuthToken(): string | null {
  // Read the initial value synchronously (important: the first
  // render must see the token if it's already there).
  const [token, setToken] = useState<string | null>(
    () => stripBearer(tokenStore.get()),
  );

  useEffect(() => {
    // Re-sync in case the token changed between initial state
    // computation and this effect running.
    setToken(stripBearer(tokenStore.get()));

    // Subscribe to future changes.
    const unsubscribe = tokenStore.subscribe((t) => {
      setToken(stripBearer(t));
    });
    return unsubscribe;
  }, []);

  return token;
}

import { useState } from "react";

export function useNotifications(): void {
  const token = useAuthToken();
  const logout = useAuthStore((s) => s.logout);

  const addFromWs = useNotificationStore((s) => s.addFromWs);
  const setUnread = useNotificationStore((s) => s.setUnread);
  const setConnected = useNotificationStore((s) => s.setConnected);
  const hydrate = useNotificationStore((s) => s.hydrate);
  const reset = useNotificationStore((s) => s.reset);

  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const stoppedRef = useRef(false);
  const reconnectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    console.log("[notifications] state", {
      hasToken: !!token,
      tokenLength: token?.length ?? 0,
      API_BASE,
      WS_BASE,
    });
  }, [token]);

  // ── REST seed ───────────────────────────────────────
  useEffect(() => {
    if (!token) {
      reset();
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [listRes, countRes] = await Promise.all([
          fetch(`${API_BASE}/notifications?limit=30`, { headers }),
          fetch(`${API_BASE}/notifications/unread-count`, { headers }),
        ]);
        if (!listRes.ok || !countRes.ok) {
          throw new Error(
            `notifications seed failed: ${listRes.status}/${countRes.status}`,
          );
        }
        const list = (await listRes.json()) as NotificationRow[];
        const count = (await countRes.json()) as { unread: number };
        if (!cancelled) hydrate(list, count.unread ?? 0);
      } catch (err) {
        console.warn("[notifications] seed failed", err);
        if (!cancelled) hydrate([], 0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, hydrate, reset]);

  // ── WS lifecycle ────────────────────────────────────
  useEffect(() => {
    if (!token) {
      console.log("[notifications] ws skipped: no token");
      return;
    }
    console.log("[notifications] ws effect starting");

    stoppedRef.current = false;
    attemptRef.current = 0;

    const clearReconnect = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (stoppedRef.current) return;
      clearReconnect();
      const delay = Math.min(
        RECONNECT_MIN_MS * 2 ** attemptRef.current,
        RECONNECT_MAX_MS,
      );
      attemptRef.current += 1;
      console.log(`[notifications] reconnecting in ${delay}ms`);
      reconnectTimerRef.current = window.setTimeout(connect, delay);
    };

    const connect = () => {
      if (stoppedRef.current) return;

      const url = `${WS_BASE}/ws/user?token=${encodeURIComponent(token)}`;
      console.log(
        "[notifications] connecting to",
        url.replace(/token=[^&]+/, "token=***"),
      );

      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch (err) {
        console.error("[notifications] ws construct failed", err);
        scheduleReconnect();
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[notifications] ws opened");
        attemptRef.current = 0;
        setConnected(true);
      };

      ws.onmessage = (ev) => {
        let msg: any;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        switch (msg.type) {
          case "hello":
            break;
          case "notification":
            addFromWs(msg);
            break;
          case "unread_count":
            if (typeof msg.count === "number") setUnread(msg.count);
            break;
          case "ping":
            try {
              ws.send("ping");
            } catch {}
            break;
          default:
            break;
        }
      };

      ws.onclose = (ev) => {
        console.log("[notifications] ws closed", {
          code: ev.code,
          reason: ev.reason,
        });
        setConnected(false);
        wsRef.current = null;
        if (stoppedRef.current) return;
        if (ev.code === WS_CLOSE_UNAUTHORIZED) {
          console.warn("[notifications] unauthorized — logging out");
          void logout();
          return;
        }
        scheduleReconnect();
      };

      ws.onerror = (ev) => {
        console.error("[notifications] ws error", ev);
      };
    };

    connect();

    return () => {
      stoppedRef.current = true;
      clearReconnect();
      setConnected(false);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
        wsRef.current = null;
      }
    };
  }, [token, addFromWs, setUnread, setConnected, logout]);
}