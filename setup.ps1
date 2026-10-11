# ============================================================
# setup.ps1 — bootstrap the PriceMonitor frontend
# ============================================================
# Backs up the existing src/, writes the full tree, and leaves
# you ready to run `npm install && npm run dev`.
#
# Run from frontend/:
#   powershell -ExecutionPolicy Bypass -File setup.ps1
# ============================================================

$ErrorActionPreference = "Stop"

# Resolve the frontend root (where this script lives)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Test-Path (Join-Path $root "package.json"))) {
    Write-Error "setup.ps1 must run from the frontend/ directory (no package.json here)."
}
Set-Location $root

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " PriceMonitor frontend bootstrap" -ForegroundColor Cyan
Write-Host " root: $root" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Backup existing src/ ─────────────────────────────────
if (Test-Path "src") {
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backup = "src.backup-$stamp"
    Write-Host "[backup] Moving existing src/ to $backup" -ForegroundColor Yellow
    Move-Item -Path "src" -Destination $backup
}
New-Item -ItemType Directory -Path "src" -Force | Out-Null

# ── 2. Directory tree ───────────────────────────────────────
$dirs = @(
    "src/api",
    "src/components/admin",
    "src/components/auth",
    "src/components/layout",
    "src/components/product",
    "src/components/ui",
    "src/hooks",
    "src/lib",
    "src/pages/auth",
    "src/pages/shopper",
    "src/pages/admin",
    "src/pages/superadmin",
    "src/store",
    ".vscode"
)
foreach ($d in $dirs) {
    New-Item -ItemType Directory -Path $d -Force | Out-Null
}
Write-Host "[tree] Created $($dirs.Count) directories" -ForegroundColor Green

# ── 3. Helper to write a file ───────────────────────────────
function Write-File {
    param(
        [Parameter(Mandatory=$true)][string]$Path,
        [Parameter(Mandatory=$true)][string]$Content
    )
    # Resolve absolute target path. If the input is relative, anchor to $PWD.
    $absolute = if ([System.IO.Path]::IsPathRooted($Path)) {
        $Path
    } else {
        Join-Path (Get-Location).Path $Path
    }

    # Ensure parent directory exists
    $parent = Split-Path -Parent $absolute
    if ($parent -and -not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    # Normalize newlines and write UTF-8 (no BOM)
    $normalized = $Content -replace "`r`n", "`n"
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($absolute, $normalized, $utf8NoBom)
}

# ============================================================
# ROOT CONFIG FILES
# ============================================================

Write-File "vite.config.ts" @'
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiTarget = env.VITE_API_TARGET || "http://127.0.0.1:8000";

  return {
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on("error", (err) => {
              console.log("[vite-proxy] error:", err.message);
            });
          },
        },
      },
    },
    build: {
      sourcemap: false,
      target: "es2022",
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            query: ["@tanstack/react-query"],
          },
        },
      },
    },
  };
});
'@

Write-File ".env" @'
VITE_API_BASE_URL=/api/v1
VITE_TURNSTILE_SITE_KEY=
VITE_API_TARGET=http://127.0.0.1:8000
'@

Write-File ".env.example" @'
VITE_API_BASE_URL=/api/v1
VITE_TURNSTILE_SITE_KEY=
VITE_API_TARGET=http://127.0.0.1:8000
'@

Write-File ".vscode/settings.json" @'
{
  "css.lint.unknownAtRules": "ignore",
  "scss.lint.unknownAtRules": "ignore"
}
'@

# ============================================================
# ENTRY POINTS
# ============================================================

Write-File "src/main.tsx" @'
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof Error && "status" in error) {
          const status = (error as { status?: number }).status;
          if (status && status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
'@

Write-File "src/index.css" @'
@tailwind base;
@tailwind components;
@tailwind utilities;

html,
body,
#root {
  height: 100%;
}

input,
select,
textarea,
button {
  font: inherit;
}
'@

Write-File "src/vite-env.d.ts" @'
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  readonly VITE_API_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
'@

Write-Host "[files] Root config + entry points written" -ForegroundColor Green

# ============================================================
# LIB
# ============================================================

Write-File "src/lib/env.ts" @'
function get(key: string, fallback: string): string {
  const v = import.meta.env[key as keyof ImportMetaEnv];
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

export const env = {
  apiBaseUrl: get("VITE_API_BASE_URL", "/api/v1"),
  turnstileSiteKey: get("VITE_TURNSTILE_SITE_KEY", ""),
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
'@

Write-File "src/lib/roles.ts" @'
export type Role = "user" | "admin" | "superadmin";

const ORDER: Record<Role, number> = {
  user: 0,
  admin: 1,
  superadmin: 2,
};

export function hasRole(
  userRole: Role | undefined | null,
  required: Role,
): boolean {
  if (!userRole) return false;
  return ORDER[userRole] >= ORDER[required];
}

export function isAdmin(role: Role | undefined | null): boolean {
  return hasRole(role, "admin");
}

export function isSuperAdmin(role: Role | undefined | null): boolean {
  return hasRole(role, "superadmin");
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "superadmin":
      return "Super Administrator";
    case "admin":
      return "Administrator";
    case "user":
      return "Shopper";
  }
}
'@

Write-File "src/lib/format.ts" @'
export function formatPrice(
  value: number | null | undefined,
  currency = "DT",
): string {
  if (value == null) return "\u2014";
  return `${value.toFixed(2)} ${currency}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return d.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return d.toLocaleString("fr-FR");
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "\u2014";
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} d ago`;
  return formatDate(iso);
}

export function effectivePrice(p: {
  price: number | null;
  discount_price: number | null;
}): number | null {
  if (p.price == null) return null;
  if (p.discount_price != null && p.discount_price > 0) {
    return p.discount_price;
  }
  return p.price;
}

export function hasDiscount(p: {
  price: number | null;
  discount_price: number | null;
}): boolean {
  return (
    p.price != null &&
    p.discount_price != null &&
    p.discount_price > 0 &&
    p.discount_price < p.price
  );
}
'@

Write-File "src/lib/validation.ts" @'
import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Email is too short")
  .max(254, "Email is too long")
  .email("Invalid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a digit");

export const searchQuerySchema = z
  .string()
  .trim()
  .min(1, "Search query cannot be empty")
  .max(200, "Search query is too long")
  .refine((v) => !/[\u0000-\u001F\u007F]/.test(v), {
    message: "Search query contains control characters",
  });

export const uuidSchema = z.string().uuid("Invalid identifier");

export const turnstileTokenSchema = z
  .string()
  .min(1, "Please complete the human verification");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128),
  turnstile_token: turnstileTokenSchema.optional(),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirm_password: z.string(),
    turnstile_token: turnstileTokenSchema.optional(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
'@

Write-File "src/lib/http.ts" @'
import { env } from "./env";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  request_id: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string;
  readonly details: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    requestId: string,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

let accessToken: string | null = null;

export const tokenStore = {
  get: (): string | null => accessToken,
  set: (token: string | null): void => {
    accessToken = token;
  },
  clear: (): void => {
    accessToken = null;
  },
};

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

function buildUrl(
  path: string,
  query?: RequestOptions["query"],
): string {
  const base = env.apiBaseUrl.replace(/\/+$/, "");
  const url = new URL(
    `${base}${path.startsWith("/") ? path : `/${path}`}`,
    window.location.origin,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function isJsonContentType(res: Response): boolean {
  const ct = res.headers.get("content-type") ?? "";
  return ct.includes("application/json");
}

async function parseError(res: Response): Promise<ApiError> {
  const fallbackRequestId = res.headers.get("x-request-id") ?? "unknown";
  if (isJsonContentType(res)) {
    try {
      const body = (await res.json()) as Partial<ApiErrorBody>;
      const err = body?.error;
      return new ApiError(
        res.status,
        err?.code ?? "http_error",
        err?.message ?? res.statusText ?? "Request failed",
        body?.request_id ?? fallbackRequestId,
        err?.details ?? {},
      );
    } catch {
      // fall through
    }
  }
  return new ApiError(
    res.status,
    "http_error",
    res.statusText || "Request failed",
    fallbackRequestId,
  );
}

let refreshInFlight: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const url = buildUrl("/auth/refresh");
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok) return false;
      if (!isJsonContentType(res)) return false;
      const data = (await res.json()) as { access_token?: string };
      if (!data.access_token) return false;
      tokenStore.set(data.access_token);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function httpRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    query,
    body,
    signal,
    headers: extraHeaders,
    skipAuth = false,
    skipRefresh = false,
  } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...extraHeaders,
  };

  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (!skipAuth) {
    const token = tokenStore.get();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const doFetch = async (): Promise<Response> => {
    const init: RequestInit = {
      method,
      headers,
      credentials: "include",
      redirect: "follow",
    };
    if (signal) init.signal = signal;
    if (body !== undefined) init.body = JSON.stringify(body);
    return fetch(buildUrl(path, query), init);
  };

  let res: Response;
  try {
    res = await doFetch();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new ApiError(
      0,
      "network_error",
      "Network error \u2014 check your connection.",
      "unknown",
    );
  }

  if (res.status === 401 && !skipRefresh) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      res = await doFetch();
    } else {
      onUnauthorized?.();
      throw await parseError(res);
    }
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) return undefined as T;
  if (!isJsonContentType(res)) return undefined as T;
  return (await res.json()) as T;
}
'@

Write-File "src/lib/turnstile.ts" @'
declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<void> | null = null;

export function loadTurnstile(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Turnstile"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function renderTurnstile(
  container: HTMLElement,
  siteKey: string,
  onToken: (token: string) => void,
): string | null {
  if (!window.turnstile) return null;
  return window.turnstile.render(container, {
    sitekey: siteKey,
    callback: onToken,
  });
}
'@

Write-Host "[files] lib/ written" -ForegroundColor Green

# ============================================================
# API LAYER
# ============================================================

Write-File "src/api/client.ts" @'
import { httpRequest, type RequestOptions } from "@/lib/http";

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    httpRequest<T>(path, { ...options, method: "GET" }),

  post: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => httpRequest<T>(path, { ...options, method: "POST", body }),

  put: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => httpRequest<T>(path, { ...options, method: "PUT", body }),

  patch: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => httpRequest<T>(path, { ...options, method: "PATCH", body }),

  delete: <T>(
    path: string,
    options?: Omit<RequestOptions, "method" | "body">,
  ) => httpRequest<T>(path, { ...options, method: "DELETE" }),
};
'@

Write-File "src/api/auth.ts" @'
import { api } from "./client";
import { httpRequest, tokenStore } from "@/lib/http";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validation";
import type { Role } from "@/lib/roles";

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  role: Role;
}

interface TokenResponse {
  access_token: string;
  user: User;
}

export async function login(input: LoginInput): Promise<User> {
  const parsed = loginSchema.parse(input);
  const data = await api.post<TokenResponse>("/auth/login", parsed, {
    skipAuth: true,
    skipRefresh: true,
  });
  tokenStore.set(data.access_token);
  return data.user;
}

export async function register(input: RegisterInput): Promise<User> {
  const parsed = registerSchema.parse(input);
  const { confirm_password: _c, ...payload } = parsed;
  return api.post<User>("/auth/register", payload, {
    skipAuth: true,
    skipRefresh: true,
  });
}

export async function logout(): Promise<void> {
  try {
    await api.post<void>("/auth/logout");
  } finally {
    tokenStore.clear();
  }
}

export async function me(): Promise<User> {
  return api.get<User>("/auth/me");
}

export async function refresh(): Promise<string> {
  const data = await httpRequest<{ access_token: string }>("/auth/refresh", {
    method: "POST",
    skipAuth: true,
    skipRefresh: true,
  });
  tokenStore.set(data.access_token);
  return data.access_token;
}
'@

Write-File "src/api/products.ts" @'
import { api } from "./client";
import { z } from "zod";
import { uuidSchema } from "@/lib/validation";

export interface ProductSummary {
  id: string;
  site: string;
  main_product_id: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  price: number | null;
  discount_price: number | null;
  availability: string | null;
  main_image: string | null;
  last_checked: string | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ListProductsParams {
  page?: number;
  page_size?: number;
  site?: string;
  brand?: string;
  category?: string;
  availability?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: "name" | "price" | "brand" | "category" | "last_updated_at";
  sort_order?: "asc" | "desc";
}

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  site: z.string().trim().max(50).optional(),
  brand: z.string().trim().max(200).optional(),
  category: z.string().trim().max(200).optional(),
  availability: z.string().trim().max(20).optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  sort_by: z
    .enum(["name", "price", "brand", "category", "last_updated_at"])
    .optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),
});

export async function listProducts(
  params: ListProductsParams = {},
): Promise<Paginated<ProductSummary>> {
  const parsed = listQuerySchema.parse(params);
  const query: Record<string, string | number | undefined> = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (v !== undefined) query[k] = v as string | number;
  }
  return api.get<Paginated<ProductSummary>>("/products", { query });
}

export async function getProduct(id: string): Promise<ProductSummary> {
  return api.get<ProductSummary>(`/products/${uuidSchema.parse(id)}`);
}
'@

Write-File "src/api/alerts.ts" @'
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
'@

Write-File "src/api/admin.ts" @'
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
'@

Write-Host "[files] api/ written" -ForegroundColor Green

# ============================================================
# STORE + HOOKS
# ============================================================

Write-File "src/store/auth.ts" @'
import { create } from "zustand";
import { tokenStore, setUnauthorizedHandler } from "@/lib/http";
import * as authApi from "@/api/auth";
import type { User } from "@/api/auth";

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "anonymous";
  error: string | null;
  login: (
    email: string,
    password: string,
    turnstileToken?: string,
  ) => Promise<User>;
  register: (
    email: string,
    password: string,
    confirmPassword: string,
    turnstileToken?: string,
  ) => Promise<User>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "idle",
  error: null,

  async login(email, password, turnstileToken) {
    set({ status: "loading", error: null });
    try {
      const user = await authApi.login({
        email,
        password,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      });
      set({ user, status: "authenticated" });
      return user;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      set({ status: "anonymous", error: message });
      throw err;
    }
  },

  async register(email, password, confirmPassword, turnstileToken) {
    set({ status: "loading", error: null });
    try {
      await authApi.register({
        email,
        password,
        confirm_password: confirmPassword,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      });
      return await get().login(email, password, turnstileToken);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registration failed";
      set({ status: "anonymous", error: message });
      throw err;
    }
  },

  async logout() {
    try {
      await authApi.logout();
    } finally {
      tokenStore.clear();
      set({ user: null, status: "anonymous", error: null });
    }
  },

  async hydrate() {
    set({ status: "loading" });
    try {
      await authApi.refresh();
      const user = await authApi.me();
      set({ user, status: "authenticated" });
    } catch {
      tokenStore.clear();
      set({ user: null, status: "anonymous" });
    }
  },

  clearError() {
    set({ error: null });
  },
}));

setUnauthorizedHandler(() => {
  tokenStore.clear();
  useAuthStore.setState({ user: null, status: "anonymous", error: null });
});
'@

Write-File "src/hooks/useAuth.ts" @'
import { useAuthStore } from "@/store/auth";
import { isAdmin, isSuperAdmin, hasRole, type Role } from "@/lib/roles";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const hydrate = useAuthStore((s) => s.hydrate);
  const clearError = useAuthStore((s) => s.clearError);

  const role: Role | null = user?.role ?? null;

  return {
    user,
    role,
    status,
    error,
    isAuthenticated: status === "authenticated",
    isAdmin: isAdmin(role),
    isSuperAdmin: isSuperAdmin(role),
    hasRole: (required: Role) => hasRole(role, required),
    login,
    register,
    logout,
    hydrate,
    clearError,
  };
}
'@

Write-File "src/hooks/useEventLogger.ts" @'
import { useEffect } from "react";
import { env } from "@/lib/env";

interface EventPayload {
  type: string;
  product_id: string;
  metadata?: Record<string, unknown>;
  ts: string;
}

function beacon(payload: EventPayload): void {
  const body = JSON.stringify({ events: [payload] });
  const url = `${env.apiBaseUrl}/recommendations/events`;
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch(url, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  }).catch(() => {
    // silently ignore
  });
}

export function useViewLogger(productId: string | null | undefined): void {
  useEffect(() => {
    if (!productId) return;
    const started = Date.now();
    beacon({
      type: "view",
      product_id: productId,
      ts: new Date().toISOString(),
    });
    return () => {
      const seconds = Math.round((Date.now() - started) / 1000);
      if (seconds < 2) return;
      beacon({
        type: "dwell",
        product_id: productId,
        metadata: { seconds },
        ts: new Date().toISOString(),
      });
    };
  }, [productId]);
}
'@

Write-Host "[files] store + hooks written" -ForegroundColor Green

# ============================================================
# UI PRIMITIVES
# ============================================================

Write-File "src/components/ui/Spinner.tsx" @'
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className="inline-block animate-spin rounded-full border-2 border-gray-300 border-t-brand-600"
      style={{ width: size, height: size }}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size={32} />
    </div>
  );
}
'@

Write-File "src/components/ui/Button.tsx" @'
import { forwardRef, type ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
  danger: "bg-danger-600 text-white hover:bg-danger-700 disabled:bg-danger-300",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
  outline:
    "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      className,
      children,
      disabled,
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium",
        "transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1",
        "disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading && (
        <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {children}
    </button>
  ),
);

Button.displayName = "Button";
export default Button;
'@

Write-File "src/components/ui/Input.tsx" @'
import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | undefined;
  hint?: string | undefined;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, ...rest }, ref) => {
    const inputId =
      id ??
      (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
    const errorId = inputId ? `${inputId}-error` : undefined;
    const hintId = inputId ? `${inputId}-hint` : undefined;
    const describedBy = error ? errorId : hint ? hintId : undefined;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          className={clsx(
            "block w-full rounded-md border px-3 py-2 text-sm bg-white",
            "focus:outline-none focus:ring-2 focus:ring-brand-500",
            error
              ? "border-danger-500 focus:ring-danger-500"
              : "border-gray-300",
            className,
          )}
          {...rest}
        />
        {error && (
          <p id={errorId} className="text-xs text-danger-600">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={hintId} className="text-xs text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
'@

Write-File "src/components/ui/Badge.tsx" @'
import type { ReactNode } from "react";
import clsx from "clsx";

type Tone = "gray" | "brand" | "success" | "warning" | "danger" | "info";

const TONES: Record<Tone, string> = {
  gray: "bg-gray-100 text-gray-700",
  brand: "bg-brand-50 text-brand-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-danger-50 text-danger-700",
  info: "bg-blue-50 text-blue-700",
};

export default function Badge({
  tone = "gray",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
'@

Write-File "src/components/ui/Card.tsx" @'
import type { ReactNode } from "react";
import clsx from "clsx";

export default function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={clsx(
        "bg-white rounded-lg border border-gray-200 shadow-sm",
        padded && "p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
'@

Write-File "src/components/ui/EmptyState.tsx" @'
import type { ReactNode } from "react";

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-900 font-medium">{title}</p>
      {description && (
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
'@

Write-File "src/components/ui/ErrorState.tsx" @'
import Button from "./Button";

export default function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="text-center py-12">
      <p className="text-danger-600 font-medium">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
'@

Write-File "src/components/ui/Modal.tsx" @'
import { useEffect, type ReactNode } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 id="modal-title" className="text-lg font-semibold">
            {title}
          </h2>
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
'@

Write-Host "[files] ui/ written" -ForegroundColor Green

# ============================================================
# ROUTE GUARDS
# ============================================================

Write-File "src/components/auth/ProtectedRoute.tsx" @'
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { FullPageSpinner } from "@/components/ui/Spinner";

export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "idle" || status === "loading") return <FullPageSpinner />;
  if (status !== "authenticated") {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <Outlet />;
}
'@

Write-File "src/components/auth/AdminRoute.tsx" @'
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { FullPageSpinner } from "@/components/ui/Spinner";

export default function AdminRoute() {
  const { status, isAdmin } = useAuth();
  if (status === "idle" || status === "loading") return <FullPageSpinner />;
  if (status !== "authenticated") return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/403" replace />;
  return <Outlet />;
}
'@

Write-File "src/components/auth/SuperAdminRoute.tsx" @'
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { FullPageSpinner } from "@/components/ui/Spinner";

export default function SuperAdminRoute() {
  const { status, isSuperAdmin } = useAuth();
  if (status === "idle" || status === "loading") return <FullPageSpinner />;
  if (status !== "authenticated") return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/403" replace />;
  return <Outlet />;
}
'@

Write-File "src/components/auth/AnonymousOnlyRoute.tsx" @'
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { FullPageSpinner } from "@/components/ui/Spinner";

export default function AnonymousOnlyRoute() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "idle" || status === "loading") return <FullPageSpinner />;

  if (status === "authenticated" && user) {
    const dest =
      user.role === "superadmin"
        ? "/super"
        : user.role === "admin"
          ? "/admin"
          : ((location.state as { from?: string } | null)?.from ?? "/");
    return <Navigate to={dest} replace />;
  }

  return <Outlet />;
}
'@

Write-Host "[files] route guards written" -ForegroundColor Green

# ============================================================
# LAYOUT
# ============================================================

Write-File "src/components/layout/Header.tsx" @'
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";
import Badge from "@/components/ui/Badge";

export default function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      "px-3 py-2 text-sm rounded-md transition-colors",
      isActive
        ? "text-brand-700 font-medium"
        : "text-gray-700 hover:text-brand-700",
    );

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand-600 flex items-center justify-center text-white font-bold">
              P
            </div>
            <span className="text-lg font-semibold text-gray-900">
              PriceMonitor
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/products" className={linkClass}>
              Products
            </NavLink>
            <NavLink to="/search" className={linkClass}>
              Search
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/alerts" className={linkClass}>
                Alerts
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/account"
                  className="text-sm text-gray-700 hover:text-brand-700"
                >
                  {user.email}
                </Link>
                {user.role !== "user" && (
                  <Badge tone={user.role === "superadmin" ? "danger" : "warning"}>
                    {user.role}
                  </Badge>
                )}
                <button
                  onClick={() => void handleLogout()}
                  className="text-sm text-gray-700 hover:text-brand-700"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-700 hover:text-brand-700"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center h-9 px-4 text-sm font-medium rounded-md bg-brand-600 text-white hover:bg-brand-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 px-4 py-2 space-y-1">
          <NavLink to="/" end className={linkClass} onClick={() => setMobileOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/products" className={linkClass} onClick={() => setMobileOpen(false)}>
            Products
          </NavLink>
          <NavLink to="/search" className={linkClass} onClick={() => setMobileOpen(false)}>
            Search
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/alerts" className={linkClass} onClick={() => setMobileOpen(false)}>
              Alerts
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={linkClass} onClick={() => setMobileOpen(false)}>
              Admin
            </NavLink>
          )}
        </div>
      )}
    </header>
  );
}
'@

Write-File "src/components/layout/Footer.tsx" @'
export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">PriceMonitor</h3>
            <p className="mt-2 text-sm text-gray-500">
              Compare prices across 6 Tunisian retailers.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Sites
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li>MegaPC</li>
              <li>Tunisianet</li>
              <li>SBS</li>
              <li>Mytek</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Account
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li>Sign in</li>
              <li>Register</li>
              <li>Alerts</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Legal
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li>Privacy</li>
              <li>Terms</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400">
          &copy; {new Date().getFullYear()} PriceMonitor. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
'@

Write-File "src/components/layout/ShopperLayout.tsx" @'
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function ShopperLayout() {
  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
'@

Write-File "src/components/layout/AdminSidebar.tsx" @'
import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";

const baseItems = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/alerts", label: "Alerts" },
  { to: "/admin/analytics", label: "Analytics" },
];

const superItems = [
  { to: "/super", label: "Super Dashboard", end: true },
  { to: "/super/matching", label: "Matching" },
  { to: "/super/backfill", label: "Backfill" },
  { to: "/super/audit", label: "Audit" },
];

export default function AdminSidebar() {
  const { isSuperAdmin } = useAuth();

  const renderLink = (item: { to: string; label: string; end?: boolean }) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        clsx(
          "block px-3 py-2 rounded-md text-sm transition-colors",
          isActive
            ? "bg-brand-600 text-white"
            : "text-gray-700 hover:bg-gray-100",
        )
      }
    >
      {item.label}
    </NavLink>
  );

  return (
    <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 border-r border-gray-200 bg-white min-h-screen">
      <div className="p-4 border-b border-gray-200">
        <div className="text-sm font-semibold text-gray-900">Admin Console</div>
      </div>
      <nav className="p-3 space-y-1">
        {baseItems.map(renderLink)}
        {isSuperAdmin && (
          <>
            <div className="px-3 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase">
              Super Admin
            </div>
            {superItems.map(renderLink)}
          </>
        )}
      </nav>
    </aside>
  );
}
'@

Write-File "src/components/layout/AdminTopbar.tsx" @'
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Badge from "@/components/ui/Badge";

export default function AdminTopbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            &larr; Shopper view
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user && (
            <>
              <span className="text-gray-600">{user.email}</span>
              <Badge tone={user.role === "superadmin" ? "danger" : "warning"}>
                {user.role}
              </Badge>
            </>
          )}
          <button
            onClick={() => void handleLogout()}
            className="text-gray-600 hover:text-gray-900"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
'@

Write-File "src/components/layout/AdminLayout.tsx" @'
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
'@

Write-Host "[files] layout/ written" -ForegroundColor Green

# ============================================================
# PRODUCT COMPONENTS
# ============================================================

Write-File "src/components/product/PriceBadge.tsx" @'
import { effectivePrice, formatPrice, hasDiscount } from "@/lib/format";

export default function PriceBadge({
  price,
  discount_price,
}: {
  price: number | null;
  discount_price: number | null;
}) {
  const effective = effectivePrice({ price, discount_price });
  const discounted = hasDiscount({ price, discount_price });

  return (
    <div className="flex items-baseline gap-2">
      <span
        className={
          discounted
            ? "text-lg font-semibold text-danger-600"
            : "text-lg font-semibold text-gray-900"
        }
      >
        {formatPrice(effective)}
      </span>
      {discounted && price != null && (
        <span className="text-sm text-gray-400 line-through">
          {formatPrice(price)}
        </span>
      )}
    </div>
  );
}
'@

Write-File "src/components/product/SiteBadge.tsx" @'
import Badge from "@/components/ui/Badge";

const TONES: Record<string, "brand" | "info" | "success" | "warning" | "gray"> = {
  megapc: "brand",
  tunisianet: "info",
  sbs: "success",
  mytek: "warning",
  spacenet: "gray",
  skymil: "gray",
};

export default function SiteBadge({ site }: { site: string }) {
  const tone = TONES[site.toLowerCase()] ?? "gray";
  return <Badge tone={tone}>{site}</Badge>;
}
'@

Write-File "src/components/product/ProductCard.tsx" @'
import { Link } from "react-router-dom";
import PriceBadge from "./PriceBadge";
import SiteBadge from "./SiteBadge";
import type { ProductSummary } from "@/api/products";

export default function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="group block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {product.main_image ? (
          <img
            src={product.main_image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            No image
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <SiteBadge site={product.site} />
          {product.availability && (
            <span className="text-xs text-gray-500">
              {product.availability}
            </span>
          )}
        </div>
        <h3 className="text-sm text-gray-900 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        {product.brand && (
          <p className="text-xs text-gray-500">{product.brand}</p>
        )}
        <PriceBadge
          price={product.price}
          discount_price={product.discount_price}
        />
      </div>
    </Link>
  );
}
'@

Write-File "src/components/product/ProductGrid.tsx" @'
import ProductCard from "./ProductCard";
import type { ProductSummary } from "@/api/products";

export default function ProductGrid({
  products,
}: {
  products: ProductSummary[];
}) {
  if (products.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
'@

Write-File "src/components/product/ProductFilters.tsx" @'
import Badge from "@/components/ui/Badge";

export interface Filters {
  site: string;
  brand: string;
  category: string;
  availability: string;
  sort_by: "name" | "price" | "brand" | "category" | "last_updated_at";
  sort_order: "asc" | "desc";
}

export const SITES = [
  "megapc",
  "tunisianet",
  "sbs",
  "mytek",
  "spacenet",
  "skymil",
];

export const AVAILABILITIES = ["in_stock", "out_of_stock"];

export default function ProductFilters({
  filters,
  onChange,
  onReset,
}: {
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  onReset: () => void;
}) {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-24 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
          <button
            onClick={onReset}
            className="text-xs text-brand-600 hover:underline"
          >
            Reset
          </button>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Site
          </h3>
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="site"
                checked={filters.site === ""}
                onChange={() => onChange({ site: "" })}
              />
              <span>All sites</span>
            </label>
            {SITES.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="site"
                  checked={filters.site === s}
                  onChange={() => onChange({ site: s })}
                />
                <SiteBadge site={s} />
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Availability
          </h3>
          <select
            value={filters.availability}
            onChange={(e) => onChange({ availability: e.target.value })}
            className="w-full text-sm rounded-md border border-gray-300 px-2 py-1.5"
          >
            <option value="">Any</option>
            {AVAILABILITIES.map((a) => (
              <option key={a} value={a}>
                {a.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Sort
          </h3>
          <select
            value={`${filters.sort_by}:${filters.sort_order}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split(":") as [
                Filters["sort_by"],
                Filters["sort_order"],
              ];
              onChange({ sort_by: by, sort_order: order });
            }}
            className="w-full text-sm rounded-md border border-gray-300 px-2 py-1.5"
          >
            <option value="last_updated_at:desc">Newest</option>
            <option value="price:asc">Price: low to high</option>
            <option value="price:desc">Price: high to low</option>
            <option value="name:asc">Name A-Z</option>
          </select>
        </div>
      </div>
    </aside>
  );
}

// Re-import so the sub-component file compiles standalone
import SiteBadge from "./SiteBadge";
'@

Write-Host "[files] product/ written" -ForegroundColor Green

# ============================================================
# PAGES — AUTH
# ============================================================

Write-File "src/pages/auth/Login.tsx" @'
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { loginSchema, type LoginInput } from "@/lib/validation";
import { useAuth } from "@/hooks/useAuth";
import { env } from "@/lib/env";
import { loadTurnstile, renderTurnstile } from "@/lib/turnstile";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError, clearError } = useAuth();

  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const turnstileRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (!env.turnstileSiteKey || !turnstileRef.current) return;
    let cancelled = false;
    void loadTurnstile().then(() => {
      if (cancelled || !turnstileRef.current) return;
      renderTurnstile(turnstileRef.current, env.turnstileSiteKey, setTurnstileToken);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (values: LoginInput) => {
    try {
      const user = await login(values.email, values.password, turnstileToken);
      const from =
        (location.state as { from?: string } | null)?.from ??
        (user.role === "superadmin"
          ? "/super"
          : user.role === "admin"
            ? "/admin"
            : "/");
      navigate(from, { replace: true });
    } catch {
      // handled by store
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-xl font-semibold mb-6">Sign in</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            autoFocus
            {...register("email")}
            error={errors.email?.message}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            error={errors.password?.message}
          />
          {env.turnstileSiteKey && <div ref={turnstileRef} />}
          {authError && (
            <div role="alert" className="text-sm text-danger-600">
              {authError}
            </div>
          )}
          <Button type="submit" loading={isSubmitting} className="w-full">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="text-sm text-gray-600 mt-6">
          No account?{" "}
          <Link to="/register" className="text-brand-600 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
'@

Write-File "src/pages/auth/Register.tsx" @'
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { registerSchema, type RegisterInput } from "@/lib/validation";
import { useAuth } from "@/hooks/useAuth";
import { env } from "@/lib/env";
import { loadTurnstile, renderTurnstile } from "@/lib/turnstile";

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser, error: authError, clearError } = useAuth();

  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();
  const turnstileRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirm_password: "" },
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (!env.turnstileSiteKey || !turnstileRef.current) return;
    let cancelled = false;
    void loadTurnstile().then(() => {
      if (cancelled || !turnstileRef.current) return;
      renderTurnstile(turnstileRef.current, env.turnstileSiteKey, setTurnstileToken);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (values: RegisterInput) => {
    try {
      await registerUser(
        values.email,
        values.password,
        values.confirm_password,
        turnstileToken,
      );
      navigate("/", { replace: true });
    } catch {
      // handled
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-xl font-semibold mb-6">Create account</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            autoFocus
            {...register("email")}
            error={errors.email?.message}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
            error={errors.password?.message}
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            {...register("confirm_password")}
            error={errors.confirm_password?.message}
          />
          {env.turnstileSiteKey && <div ref={turnstileRef} />}
          {authError && (
            <div role="alert" className="text-sm text-danger-600">
              {authError}
            </div>
          )}
          <Button type="submit" loading={isSubmitting} className="w-full">
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <p className="text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
'@

Write-Host "[files] auth pages written" -ForegroundColor Green

# ============================================================
# PAGES — SHOPPER
# ============================================================

Write-File "src/pages/shopper/Home.tsx" @'
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/api/products";
import ProductGrid from "@/components/product/ProductGrid";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

export default function Home() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["products", "home"],
    queryFn: () =>
      listProducts({
        page: 1,
        page_size: 8,
        sort_by: "last_updated_at",
        sort_order: "desc",
      }),
  });

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl px-8 py-16 text-white">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold leading-tight">
            Compare prices across Tunisia
          </h1>
          <p className="mt-4 text-lg text-brand-50">
            Find the best deal on electronics, appliances, and more. We track 6
            major retailers so you don't have to.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="inline-flex items-center h-11 px-6 rounded-md bg-white text-brand-700 font-medium hover:bg-brand-50"
            >
              Browse products
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center h-11 px-6 rounded-md bg-brand-800/40 text-white font-medium hover:bg-brand-800/60"
            >
              Search now
            </Link>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              New arrivals
            </h2>
            <p className="text-sm text-gray-500">
              Fresh listings across all sites
            </p>
          </div>
          <Link
            to="/products"
            className="text-sm text-brand-600 hover:underline"
          >
            View all
          </Link>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-200 aspect-[3/4] animate-pulse"
              />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-12">
            <p className="text-danger-600">
              {error instanceof Error ? error.message : "Failed to load"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        )}

        {data && data.items.length === 0 && (
          <EmptyState
            title="No products yet"
            description="Products will appear here once the scrapers run."
          />
        )}

        {data && data.items.length > 0 && (
          <ProductGrid products={data.items} />
        )}
      </section>
    </div>
  );
}
'@

Write-File "src/pages/shopper/Products.tsx" @'
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listProducts, type ListProductsParams } from "@/api/products";
import ProductGrid from "@/components/product/ProductGrid";
import ProductFilters, {
  type Filters,
} from "@/components/product/ProductFilters";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Button from "@/components/ui/Button";

const DEFAULT_FILTERS: Filters = {
  site: "",
  brand: "",
  category: "",
  availability: "",
  sort_by: "last_updated_at",
  sort_order: "desc",
};

export default function Products() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const params: ListProductsParams = useMemo(
    () => ({
      page,
      page_size: 20,
      ...(filters.site ? { site: filters.site } : {}),
      ...(filters.brand ? { brand: filters.brand } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.availability
        ? { availability: filters.availability }
        : {}),
      sort_by: filters.sort_by,
      sort_order: filters.sort_order,
    }),
    [page, filters],
  );

  const query = useQuery({
    queryKey: ["products", params],
    queryFn: () => listProducts(params),
  });

  const handleFilterChange = (next: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...next }));
    setPage(1);
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <p className="text-sm text-gray-500 mt-1">
          {query.data ? `${query.data.total} products` : "Loading..."}
        </p>
      </div>

      <div className="flex gap-8">
        <ProductFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
        />

        <div className="flex-1 min-w-0 space-y-6">
          {query.isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg border border-gray-200 aspect-[3/4] animate-pulse"
                />
              ))}
            </div>
          )}

          {query.isError && (
            <ErrorState
              message={
                query.error instanceof Error
                  ? query.error.message
                  : "Failed to load products"
              }
              onRetry={() => query.refetch()}
            />
          )}

          {query.data && query.data.items.length === 0 && (
            <EmptyState
              title="No products match your filters"
              description="Try removing a filter or broadening your search."
              action={
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Reset filters
                </Button>
              }
            />
          )}

          {query.data && query.data.items.length > 0 && (
            <>
              <ProductGrid products={query.data.items} />

              {query.data.total_pages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-500">
                    Page {query.data.page} of {query.data.total_pages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= query.data.total_pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
'@

Write-File "src/pages/shopper/ProductDetail.tsx" @'
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProduct } from "@/api/products";
import { useViewLogger } from "@/hooks/useEventLogger";
import PriceBadge from "@/components/product/PriceBadge";
import SiteBadge from "@/components/product/SiteBadge";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { FullPageSpinner } from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import { formatRelative } from "@/lib/format";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });

  useViewLogger(id);

  if (query.isLoading) return <FullPageSpinner />;
  if (query.isError)
    return (
      <ErrorState
        message={
          query.error instanceof Error
            ? query.error.message
            : "Failed to load product"
        }
        onRetry={() => query.refetch()}
      />
    );
  if (!query.data) return null;

  const p = query.data;

  return (
    <div className="space-y-6">
      <Link to="/products" className="text-sm text-brand-600 hover:underline">
        &larr; Back to products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card padded={false} className="overflow-hidden">
          <div className="aspect-square bg-gray-100">
            {p.main_image ? (
              <img
                src={p.main_image}
                alt={p.name}
                className="w-full h-full object-contain p-8"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image available
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <SiteBadge site={p.site} />
            {p.availability && (
              <Badge
                tone={
                  p.availability === "in_stock" ? "success" : "warning"
                }
              >
                {p.availability.replace("_", " ")}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-semibold text-gray-900">{p.name}</h1>

          {p.brand && (
            <p className="text-sm text-gray-500">
              Brand: <span className="text-gray-900">{p.brand}</span>
            </p>
          )}
          {p.category && (
            <p className="text-sm text-gray-500">
              Category: <span className="text-gray-900">{p.category}</span>
            </p>
          )}

          <div className="pt-2">
            <PriceBadge price={p.price} discount_price={p.discount_price} />
          </div>

          {p.last_checked && (
            <p className="text-xs text-gray-400">
              Last checked {formatRelative(p.last_checked)}
            </p>
          )}

          <div className="pt-4">
            <a
              href={`/compare/product/${p.id}`}
              className="inline-flex items-center h-11 px-6 rounded-md bg-brand-600 text-white font-medium hover:bg-brand-700"
            >
              Compare across sites
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
'@

Write-File "src/pages/shopper/Search.tsx" @'
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/api/products";
import { searchQuerySchema } from "@/lib/validation";
import ProductGrid from "@/components/product/ProductGrid";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

export default function Search() {
  const [submitted, setSubmitted] = useState("");
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | undefined>();

  const query = useQuery({
    queryKey: ["search", submitted],
    queryFn: () =>
      listProducts({
        page: 1,
        page_size: 20,
        sort_by: "last_updated_at",
        sort_order: "desc",
      }),
    enabled: submitted.length > 0,
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    try {
      const validated = searchQuerySchema.parse(input);
      setInputError(undefined);
      setSubmitted(validated);
    } catch (err) {
      setInputError(
        err instanceof Error ? err.message : "Invalid search query",
      );
    }
  };

  // Client-side filter on the returned page
  const filtered = query.data?.items.filter((p) =>
    p.name.toLowerCase().includes(submitted.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Search</h1>
        <p className="text-sm text-gray-500 mt-1">
          Find products across all retailers
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 max-w-2xl">
        <div className="flex-1">
          <Input
            placeholder="Search products..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            error={inputError}
          />
        </div>
        <Button type="submit" size="md">
          Search
        </Button>
      </form>

      {query.isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 aspect-[3/4] animate-pulse"
            />
          ))}
        </div>
      )}

      {query.data && filtered && filtered.length === 0 && (
        <EmptyState
          title="No results"
          description={`Nothing matched "${submitted}"`}
        />
      )}

      {filtered && filtered.length > 0 && <ProductGrid products={filtered} />}
    </div>
  );
}
'@

Write-File "src/pages/shopper/Alerts.tsx" @'
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAlerts, resolveAlert } from "@/api/alerts";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { formatRelative } from "@/lib/format";

export default function Alerts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["alerts", { page: 1, page_size: 50 }],
    queryFn: () => listAlerts({ page: 1, page_size: 50 }),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: number) => resolveAlert(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Alerts</h1>
        <p className="text-sm text-gray-500 mt-1">
          Price and availability changes on your products
        </p>
      </div>

      <Card padded={false}>
        {query.isLoading && (
          <div className="p-6 text-sm text-gray-500">Loading...</div>
        )}
        {query.isError && (
          <ErrorState
            message={
              query.error instanceof Error
                ? query.error.message
                : "Failed to load alerts"
            }
            onRetry={() => query.refetch()}
          />
        )}
        {query.data && query.data.items.length === 0 && (
          <EmptyState
            title="No alerts yet"
            description="You'll see alerts here when monitored products change."
          />
        )}
        {query.data && query.data.items.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {query.data.items.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {a.alert_type ?? "Alert"}
                    </span>
                    {a.severity && (
                      <Badge
                        tone={
                          a.severity === "high"
                            ? "danger"
                            : a.severity === "medium"
                              ? "warning"
                              : "gray"
                        }
                      >
                        {a.severity}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {a.site ?? "unknown site"} &middot;{" "}
                    {formatRelative(a.created_at)}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={a.is_resolved || resolveMutation.isPending}
                  onClick={() => resolveMutation.mutate(a.id)}
                >
                  {a.is_resolved ? "Resolved" : "Mark resolved"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
'@

Write-File "src/pages/shopper/Account.tsx" @'
import { useAuth } from "@/hooks/useAuth";
import { roleLabel } from "@/lib/roles";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function Account() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Account</h1>
        <p className="text-sm text-gray-500 mt-1">Your profile and settings</p>
      </div>

      <Card>
        <dl className="space-y-4">
          <div>
            <dt className="text-xs font-semibold text-gray-500 uppercase">
              Email
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-gray-500 uppercase">
              Role
            </dt>
            <dd className="mt-1">
              <Badge
                tone={
                  user.role === "superadmin"
                    ? "danger"
                    : user.role === "admin"
                      ? "warning"
                      : "gray"
                }
              >
                {roleLabel(user.role)}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-gray-500 uppercase">
              Status
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {user.is_active ? "Active" : "Inactive"} &middot;{" "}
              {user.is_verified ? "Verified" : "Unverified"}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
'@

Write-File "src/pages/shopper/NotFound.tsx" @'
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="text-gray-500 mt-4">This page doesn't exist.</p>
      <Link
        to="/"
        className="inline-block mt-6 text-brand-600 hover:underline"
      >
        &larr; Back to home
      </Link>
    </div>
  );
}
'@

Write-File "src/pages/shopper/Forbidden.tsx" @'
import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <div className="text-center py-24">
      <h1 className="text-6xl font-bold text-gray-900">403</h1>
      <p className="text-gray-500 mt-4">
        You don't have permission to view this page.
      </p>
      <Link
        to="/"
        className="inline-block mt-6 text-brand-600 hover:underline"
      >
        &larr; Back to home
      </Link>
    </div>
  );
}
'@

Write-Host "[files] shopper pages written" -ForegroundColor Green

# ============================================================
# PAGES — ADMIN
# ============================================================

Write-File "src/pages/admin/AdminDashboard.tsx" @'
import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/api/products";
import { listAlerts } from "@/api/alerts";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatRelative } from "@/lib/format";

function StatCard({
  label,
  value,
  tone = "gray",
}: {
  label: string;
  value: string | number;
  tone?: "gray" | "brand" | "success" | "warning" | "danger";
}) {
  return (
    <Card>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-gray-900">{value}</span>
        <Badge tone={tone}>live</Badge>
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const productsQuery = useQuery({
    queryKey: ["admin", "products-count"],
    queryFn: () => listProducts({ page: 1, page_size: 1 }),
  });

  const alertsQuery = useQuery({
    queryKey: ["admin", "alerts-count"],
    queryFn: () => listAlerts({ page: 1, page_size: 5, is_resolved: false }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Admin dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your catalog and alerts
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Products"
          value={productsQuery.data?.total ?? "..."}
          tone="brand"
        />
        <StatCard
          label="Open alerts"
          value={alertsQuery.data?.total ?? "..."}
          tone="warning"
        />
        <StatCard label="Sites" value={6} tone="success" />
        <StatCard label="Status" value="Operational" tone="success" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Recent alerts
          </h2>
        </div>
        {alertsQuery.data && alertsQuery.data.items.length === 0 && (
          <p className="text-sm text-gray-500">No open alerts.</p>
        )}
        {alertsQuery.data && alertsQuery.data.items.length > 0 && (
          <ul className="divide-y divide-gray-100 -mx-6">
            {alertsQuery.data.items.map((a) => (
              <li
                key={a.id}
                className="px-6 py-3 flex items-center justify-between text-sm"
              >
                <div>
                  <span className="font-medium">{a.alert_type ?? "Alert"}</span>{" "}
                  <span className="text-gray-500">
                    on {a.site ?? "unknown"}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {formatRelative(a.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
'@

Write-File "src/pages/admin/AdminProducts.tsx" @'
import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/api/products";
import Card from "@/components/ui/Card";
import { formatPrice, formatRelative } from "@/lib/format";
import SiteBadge from "@/components/product/SiteBadge";
import ErrorState from "@/components/ui/ErrorState";

export default function AdminProducts() {
  const query = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => listProducts({ page: 1, page_size: 50 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <p className="text-sm text-gray-500 mt-1">
          Raw listings as scraped from each site
        </p>
      </div>

      <Card padded={false}>
        {query.isLoading && (
          <div className="p-6 text-sm text-gray-500">Loading...</div>
        )}
        {query.isError && (
          <ErrorState
            message={
              query.error instanceof Error
                ? query.error.message
                : "Failed to load"
            }
            onRetry={() => query.refetch()}
          />
        )}
        {query.data && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">
                    Site
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">
                    Price
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">
                    Checked
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {query.data.items.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 max-w-md truncate">{p.name}</td>
                    <td className="px-4 py-2">
                      <SiteBadge site={p.site} />
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatPrice(p.price)}
                    </td>
                    <td className="px-4 py-2 text-gray-500">
                      {formatRelative(p.last_checked)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
'@

Write-File "src/pages/admin/AdminAlerts.tsx" @'
import { useQuery } from "@tanstack/react-query";
import { listAlerts } from "@/api/alerts";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ErrorState from "@/components/ui/ErrorState";
import { formatDateTime } from "@/lib/format";

export default function AdminAlerts() {
  const query = useQuery({
    queryKey: ["admin", "alerts"],
    queryFn: () => listAlerts({ page: 1, page_size: 100 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Alerts</h1>
        <p className="text-sm text-gray-500 mt-1">
          All alerts generated by the monitoring engine
        </p>
      </div>

      <Card padded={false}>
        {query.isLoading && (
          <div className="p-6 text-sm text-gray-500">Loading...</div>
        )}
        {query.isError && (
          <ErrorState
            message={
              query.error instanceof Error
                ? query.error.message
                : "Failed to load"
            }
            onRetry={() => query.refetch()}
          />
        )}
        {query.data && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">
                    Site
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">
                    Severity
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {query.data.items.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{a.alert_type ?? "\u2014"}</td>
                    <td className="px-4 py-2">{a.site ?? "\u2014"}</td>
                    <td className="px-4 py-2">
                      {a.severity ? (
                        <Badge
                          tone={
                            a.severity === "high"
                              ? "danger"
                              : a.severity === "medium"
                                ? "warning"
                                : "gray"
                          }
                        >
                          {a.severity}
                        </Badge>
                      ) : (
                        "\u2014"
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <Badge tone={a.is_resolved ? "success" : "warning"}>
                        {a.is_resolved ? "Resolved" : "Open"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-gray-500">
                      {formatDateTime(a.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
'@

Write-File "src/pages/admin/AdminAnalytics.tsx" @'
import Card from "@/components/ui/Card";

export default function AdminAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Price trends and volatility
        </p>
      </div>

      <Card>
        <p className="text-sm text-gray-500">
          Analytics widgets will appear here once the backend exposes the
          aggregated endpoints. Placeholder for now.
        </p>
      </Card>
    </div>
  );
}
'@

Write-File "src/pages/admin/AdminUsers.tsx" @'
import Card from "@/components/ui/Card";

export default function AdminUsers() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-1">
          Registered users and roles
        </p>
      </div>

      <Card>
        <p className="text-sm text-gray-500">
          User management will appear here once the backend exposes a users
          listing endpoint.
        </p>
      </Card>
    </div>
  );
}
'@

Write-Host "[files] admin pages written" -ForegroundColor Green

# ============================================================
# PAGES — SUPER ADMIN
# ============================================================

Write-File "src/pages/superadmin/SuperDashboard.tsx" @'
import { useQuery } from "@tanstack/react-query";
import { getMatchStats } from "@/api/admin";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

function Stat({
  label,
  value,
  tone = "gray",
}: {
  label: string;
  value: string | number;
  tone?: "gray" | "brand" | "success" | "warning" | "danger";
}) {
  return (
    <Card>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-gray-900">{value}</span>
        <Badge tone={tone}>&nbsp;</Badge>
      </div>
    </Card>
  );
}

export default function SuperDashboard() {
  const statsQuery = useQuery({
    queryKey: ["super", "match-stats"],
    queryFn: getMatchStats,
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Super admin dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Matching pipeline health and destructive operations
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Pairs total"
          value={statsQuery.data?.candidates_found ?? "\u2014"}
          tone="brand"
        />
        <Stat
          label="Accepted"
          value={statsQuery.data?.auto_accepted ?? "\u2014"}
          tone="success"
        />
        <Stat
          label="Rejected"
          value={statsQuery.data?.rule_rejected ?? "\u2014"}
          tone="warning"
        />
        <Stat
          label="Errors"
          value={statsQuery.data?.errors ?? "\u2014"}
          tone={(statsQuery.data?.errors ?? 0) > 0 ? "danger" : "success"}
        />
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          LLM verification
        </h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-500">Checked</div>
            <div className="text-lg font-semibold">
              {statsQuery.data?.llm_checked ?? "\u2014"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Accepted</div>
            <div className="text-lg font-semibold text-emerald-600">
              {statsQuery.data?.llm_accepted ?? "\u2014"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Rejected</div>
            <div className="text-lg font-semibold text-amber-600">
              {statsQuery.data?.llm_rejected ?? "\u2014"}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
'@

Write-File "src/pages/superadmin/SuperMatching.tsx" @'
import { useState } from "react";
import { runMatch, type MatchStats } from "@/api/admin";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";

export default function SuperMatching() {
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Safe incremental run
  const [maxDistance, setMaxDistance] = useState(0.25);
  const [llmBudget, setLlmBudget] = useState<number | "">("");

  // Destructive run (multi-step)
  const [destructiveOpen, setDestructiveOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [destructiveToken, setDestructiveToken] = useState("");

  const runSafe = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await runMatch({
        max_distance: maxDistance,
        llm_budget: typeof llmBudget === "number" ? llmBudget : undefined,
        sync: true,
      });
      if (res.stats) setStats(res.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Match failed");
    } finally {
      setRunning(false);
    }
  };

  const runDestructive = async () => {
    if (confirmText !== "YES-DELETE-EVERYTHING") {
      setError("Confirmation text does not match");
      return;
    }
    if (!destructiveToken) {
      setError("Admin token required");
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const res = await runMatch({
        clear_existing: true,
        confirm: confirmText,
        destructive_token: destructiveToken,
        sync: true,
      });
      if (res.stats) setStats(res.stats);
      setDestructiveOpen(false);
      setConfirmText("");
      setDestructiveToken("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Match failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Matching pipeline
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Trigger cross-site matching runs
        </p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Incremental run
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Max distance"
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
          />
          <Input
            label="LLM budget (blank = unlimited)"
            type="number"
            min="0"
            value={llmBudget}
            onChange={(e) =>
              setLlmBudget(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>
        <div className="mt-4">
          <Button onClick={() => void runSafe()} loading={running}>
            Run incremental match
          </Button>
        </div>
      </Card>

      <Card className="border-danger-200 bg-danger-50/30">
        <h2 className="text-sm font-semibold text-danger-700 mb-2">
          Destructive run
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Truncates canonical_products, base_groups, and product_match_pairs,
          then rebuilds from <code>products</code>. Requires role, confirmation
          string, and shared-secret header.
        </p>
        <Button
          variant="danger"
          onClick={() => setDestructiveOpen(true)}
          disabled={running}
        >
          Open destructive controls
        </Button>
      </Card>

      {error && (
        <div className="p-4 rounded-md bg-danger-50 border border-danger-200 text-danger-700 text-sm">
          {error}
        </div>
      )}

      {stats && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Last run stats
            </h2>
            <Badge tone="success">completed</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key}>
                <div className="text-xs text-gray-500">{key}</div>
                <div className="font-medium text-gray-900">{String(value)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={destructiveOpen}
        onClose={() => {
          setDestructiveOpen(false);
          setConfirmText("");
          setDestructiveToken("");
        }}
        title="Destructive matching run"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setDestructiveOpen(false);
                setConfirmText("");
                setDestructiveToken("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={running}
              onClick={() => void runDestructive()}
              disabled={
                confirmText !== "YES-DELETE-EVERYTHING" ||
                destructiveToken.length === 0
              }
            >
              Confirm and run
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-md bg-danger-50 border border-danger-200 text-danger-700 text-xs">
            This action will TRUNCATE canonical_products, base_groups, and
            product_match_pairs. Backups are created automatically, but this
            is irreversible without manual restore.
          </div>
          <Input
            label="Type YES-DELETE-EVERYTHING to confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
          <Input
            label="Admin token (X-Admin-Destructive-Token)"
            type="password"
            value={destructiveToken}
            onChange={(e) => setDestructiveToken(e.target.value)}
            hint="Held in memory only. Never stored."
          />
        </div>
      </Modal>
    </div>
  );
}
'@

Write-File "src/pages/superadmin/SuperBackfill.tsx" @'
import Card from "@/components/ui/Card";

export default function SuperBackfill() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Backfill</h1>
        <p className="text-sm text-gray-500 mt-1">
          Rebuild canonical_products and base_groups from products
        </p>
      </div>

      <Card>
        <p className="text-sm text-gray-500">
          Backfill runs from the CLI via{" "}
          <code className="bg-gray-100 px-1 rounded">
            python -m scripts.backfill_canonical_products
          </code>
          . A web trigger will be added once the backend exposes it.
        </p>
      </Card>
    </div>
  );
}
'@

Write-File "src/pages/superadmin/SuperAudit.tsx" @'
import Card from "@/components/ui/Card";

export default function SuperAudit() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Audit log</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every destructive operation with actor and timestamp
        </p>
      </div>

      <Card>
        <p className="text-sm text-gray-500">
          Audit log will appear here once the backend exposes a{" "}
          <code className="bg-gray-100 px-1 rounded">/audit</code> endpoint.
        </p>
      </Card>
    </div>
  );
}
'@

Write-Host "[files] super admin pages written" -ForegroundColor Green

# ============================================================
# APP ROUTER
# ============================================================

Write-File "src/App.tsx" @'
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import ShopperLayout from "@/components/layout/ShopperLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import SuperAdminRoute from "@/components/auth/SuperAdminRoute";
import AnonymousOnlyRoute from "@/components/auth/AnonymousOnlyRoute";

import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

import Home from "@/pages/shopper/Home";
import Products from "@/pages/shopper/Products";
import ProductDetail from "@/pages/shopper/ProductDetail";
import Search from "@/pages/shopper/Search";
import Alerts from "@/pages/shopper/Alerts";
import Account from "@/pages/shopper/Account";
import NotFound from "@/pages/shopper/NotFound";
import Forbidden from "@/pages/shopper/Forbidden";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminAlerts from "@/pages/admin/AdminAlerts";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminUsers from "@/pages/admin/AdminUsers";

import SuperDashboard from "@/pages/superadmin/SuperDashboard";
import SuperMatching from "@/pages/superadmin/SuperMatching";
import SuperBackfill from "@/pages/superadmin/SuperBackfill";
import SuperAudit from "@/pages/superadmin/SuperAudit";

import { useAuth } from "@/hooks/useAuth";

export default function App() {
  const hydrate = useAuth().hydrate;

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public (shopper) ─────────────────────── */}
        <Route element={<ShopperLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/403" element={<Forbidden />} />
          <Route path="/404" element={<NotFound />} />

          {/* Auth-only shopper routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/account" element={<Account />} />
          </Route>
        </Route>

        {/* ── Auth pages (redirect if already in) ──── */}
        <Route element={<ShopperLayout />}>
          <Route element={<AnonymousOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
        </Route>

        {/* ── Admin ─────────────────────────────────── */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/alerts" element={<AdminAlerts />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        </Route>

        {/* ── Super admin ──────────────────────────── */}
        <Route element={<SuperAdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/super" element={<SuperDashboard />} />
            <Route path="/super/matching" element={<SuperMatching />} />
            <Route path="/super/backfill" element={<SuperBackfill />} />
            <Route path="/super/audit" element={<SuperAudit />} />
          </Route>
        </Route>

        {/* ── Fallback ─────────────────────────────── */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
'@

Write-Host "[files] App.tsx written" -ForegroundColor Green

# ============================================================
# SUMMARY
# ============================================================

$fileCount = (Get-ChildItem -Path "src" -Recurse -File | Measure-Object).Count

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " DONE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Files written: $fileCount" -ForegroundColor Green
Write-Host " Backup:        $backup" -ForegroundColor Yellow
Write-Host ""
Write-Host " Next steps:" -ForegroundColor White
Write-Host ""
Write-Host "   1. Install dependencies:" -ForegroundColor Gray
Write-Host "        npm install" -ForegroundColor White
Write-Host "        npm install -D @hookform/resolvers" -ForegroundColor White
Write-Host ""
Write-Host "   2. Type check:" -ForegroundColor Gray
Write-Host "        npm run typecheck" -ForegroundColor White
Write-Host ""
Write-Host "   3. Start dev server (backend must be on 127.0.0.1:8000):" -ForegroundColor Gray
Write-Host "        npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "   4. Open http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host " To roll back:" -ForegroundColor Gray
Write-Host "   Remove-Item -Recurse src; Move-Item $backup src" -ForegroundColor White
Write-Host ""