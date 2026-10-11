import { api } from "./client";

export interface HealthResponse {
  status: string;
  [key: string]: unknown;
}

export interface BatchRow {
  id: string;
  site: string;
  batch_type: string;
  status: string;
  total_products: number;
  processed_products: number;
  changed_products: number;
  error_products: number;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
}

export async function getHealth(): Promise<HealthResponse> {
  return api.get<HealthResponse>("/health");
}

export async function listBatches(): Promise<BatchRow[]> {
  return api.get<BatchRow[]>("/monitoring/batches");
}