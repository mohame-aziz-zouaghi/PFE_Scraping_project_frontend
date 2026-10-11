import { api } from "./client";

export interface MatchStats {
  candidates_found: number;
  auto_accepted: number;
  rule_rejected: number;
  variant_rejected: number;
  llm_checked: number;
  llm_accepted: number;
  llm_rejected: number;
  llm_errors: number;
  llm_deferred: number;
  cluster_rejected: number;
  variant_groups_created: number;
  products_grouped: number;
  base_groups_created: number;
  base_groups_updated: number;
  pairs_linked: number;
  integrity_errors: number;
  errors: number;
}

export interface RunMatchParams {
  max_distance?: number;
  max_candidates?: number;
  llm_budget?: number;
  clear_existing?: boolean;
  confirm?: string;
  sync?: boolean;
  destructive_token?: string;
}

export async function runMatch(
  params: RunMatchParams,
): Promise<{ status: string; task_id?: string; stats?: MatchStats }> {
  const { destructive_token, ...query } = params;
  const headers: Record<string, string> = {};
  if (destructive_token) {
    headers["X-Admin-Destructive-Token"] = destructive_token;
  }
  const queryString = Object.entries(query)
    .filter(([, v]) => v !== undefined)
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join("&");
  return api.post(
    `/compare/match/run${queryString ? `?${queryString}` : ""}`,
    undefined,
    { headers },
  );
}

export async function getMatchStats(): Promise<MatchStats> {
  return api.get<MatchStats>("/compare/match/stats");
}