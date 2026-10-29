// src/store/notifications.ts
import { create } from "zustand";
import { tokenStore } from "@/lib/http";
import type { NotificationRow } from "@/components/notifications/types";

export type IncomingNotification = {
  type: "notification";
  kind: "price_alert" | "stock_alert";
  alert_id: number;
  title: string;
  body: string;
  product_id: string;
  product_name: string;
  product_url: string;
  old_price: number | null;
  new_price: number | null;
  discount_pct: number | null;
  site: string;
};

interface NotificationState {
  recent: NotificationRow[];
  unread: number;
  hydrated: boolean;
  connected: boolean;

  hydrate: (rows: NotificationRow[], unread: number) => void;
  addFromWs: (n: IncomingNotification) => void;
  markAllRead: () => Promise<void>;
  markOneRead: (id: number) => Promise<void>;
  setUnread: (n: number) => void;
  setConnected: (v: boolean) => void;
  reset: () => void;
}

const MAX_RECENT = 50;

// ── Base for API calls ──────────────────────────────────
// VITE_API_BASE_URL already ends in /api/v1 in this project,
// so we use it directly. If it were empty, calls would go
// to /api/v1/... on the current origin (Vite proxy).
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function authHeaders(): Record<string, string> | null {
  const raw = tokenStore.get();
  if (!raw) return null;
  const token = raw.replace(/^Bearer\s+/i, "");
  return { Authorization: `Bearer ${token}` };
}

function wsToRow(n: IncomingNotification): NotificationRow {
  return {
    id: n.alert_id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    product_id: n.product_id,
    product_name: n.product_name,
    product_url: n.product_url,
    old_price: n.old_price,
    new_price: n.new_price,
    discount_pct: n.discount_pct,
    is_read: false,
    created_at: new Date().toISOString(),
  };
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  recent: [],
  unread: 0,
  hydrated: false,
  connected: false,

  hydrate: (rows, unread) =>
    set({ recent: rows.slice(0, MAX_RECENT), unread, hydrated: true }),

  addFromWs: (n) =>
    set((s) => {
      if (s.recent.some((r) => r.id === n.alert_id)) return s;
      return {
        recent: [wsToRow(n), ...s.recent].slice(0, MAX_RECENT),
        unread: s.unread + 1,
      };
    }),

  // ── Mark all read (optimistic + persisted) ────────────
  markAllRead: async () => {
    // Optimistic update
    const prevUnread = get().unread;
    const prevRecent = get().recent;
    set({
      unread: 0,
      recent: get().recent.map((r) => ({ ...r, is_read: true })),
    });

    const headers = authHeaders();
    if (!headers) {
      // No token → local state is all we can do
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
        method: "POST",
        headers,
      });
      if (!res.ok) {
        // Roll back the optimistic update
        set({ unread: prevUnread, recent: prevRecent });
        console.warn(
          "[notifications] mark-all-read failed:",
          res.status,
          res.statusText,
        );
      }
    } catch (err) {
      set({ unread: prevUnread, recent: prevRecent });
      console.warn("[notifications] mark-all-read error:", err);
    }
  },

  // ── Mark one read (optimistic + persisted) ────────────
  markOneRead: async (id) => {
    const target = get().recent.find((r) => r.id === id);
    if (!target || target.is_read) return;

    const prevUnread = get().unread;
    const prevRecent = get().recent;
    set({
      unread: Math.max(0, get().unread - 1),
      recent: get().recent.map((r) =>
        r.id === id ? { ...r, is_read: true } : r,
      ),
    });

    const headers = authHeaders();
    if (!headers) return;

    try {
      const res = await fetch(
        `${API_BASE}/notifications/${id}/read`,
        { method: "POST", headers },
      );
      if (!res.ok) {
        set({ unread: prevUnread, recent: prevRecent });
        console.warn(
          "[notifications] mark-one-read failed:",
          res.status,
          res.statusText,
        );
      }
    } catch (err) {
      set({ unread: prevUnread, recent: prevRecent });
      console.warn("[notifications] mark-one-read error:", err);
    }
  },

  setUnread: (n) => set({ unread: Math.max(0, n) }),
  setConnected: (v) => set({ connected: v }),
  reset: () =>
    set({ recent: [], unread: 0, hydrated: false, connected: false }),
}));