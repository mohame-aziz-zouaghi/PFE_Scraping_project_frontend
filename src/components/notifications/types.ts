// src/components/notifications/types.ts
//
// Mirrors the `notifications` DB table (migration 027).
// Every field here has a matching column, so wiring later is a
// straight mapping from the row to this type.

export type NotificationKind = "price_alert" | "stock_alert";

export type NotificationRow = {
  id: number;
  kind: NotificationKind;
  title: string;
  body: string | null;

  // Product context — nullable because a product can be deleted
  // after the notification was written (FK is ON DELETE SET NULL
  // on some columns; ON DELETE CASCADE on product_id).
  product_id: string | null;
  product_name: string | null;
  product_url: string | null;

  // Price context — only meaningful for price_alert
  old_price: number | null;
  new_price: number | null;
  discount_pct: number | null;

  is_read: boolean;
  created_at: string;         // ISO-8601
};