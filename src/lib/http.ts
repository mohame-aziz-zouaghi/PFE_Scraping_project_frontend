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