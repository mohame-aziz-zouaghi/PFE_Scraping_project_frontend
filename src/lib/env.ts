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