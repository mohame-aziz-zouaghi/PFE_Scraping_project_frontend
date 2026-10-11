import { api } from "./client";
import { z } from "zod";

export interface Alert {
  id: number;
  product_id: string | null;
  site: string | null;
  alert_type: string | null;
  severity: string | null;
  is_resolved: boolean;
  created_at: string;
}

const listAlertsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  is_resolved: z.coerce.boolean().optional(),
});

export async function listAlerts(
  params: z.input<typeof listAlertsQuerySchema> = {},
): Promise<{ items: Alert[]; total: number }> {
  const parsed = listAlertsQuerySchema.parse(params);
  const query: Record<string, string | number | boolean | undefined> = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (v !== undefined) query[k] = v as string | number | boolean;
  }
  return api.get<{ items: Alert[]; total: number }>("/alerts", { query });
}

export async function resolveAlert(id: number): Promise<void> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid alert id");
  }
  return api.post<void>(`/alerts/${id}/resolve`);
}