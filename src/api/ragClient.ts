// src/api/ragClient.ts
/**
 * HTTP client for the RAG assistant.
 *
 * Only state this file manages: the anonymous session ID,
 * which lives in localStorage so it survives reloads.
 */

export interface SourceCard {
  kind: 'product' | 'canonical';
  name: string;
  product_id?: string;
  site?: string;
  price?: number;
  availability?: string;
  main_image?: string;
  url?: string;
  canonical_id?: string;
  site_count?: number;
  cheapest_site?: string;
}

export interface ChatResponse {
  answer: string;
  source_cards: SourceCard[];
  cached: boolean;
  refused: boolean;
  is_welcome: boolean;
  requires_auth: boolean;
  remaining_anonymous: number | null;
  session_id: string;
  latency_ms: number;
  request_id: string;
}

export interface FaqItem {
  slug: string;
  title: string;
  category: string;
}

const SESSION_KEY = 'rag_session_id';
const API_BASE = '/api/v1/rag';

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function detectLocale(): string {
  const htmlLang = document.documentElement.lang?.slice(0, 2).toLowerCase();
  if (htmlLang === 'en' || htmlLang === 'fr' || htmlLang === 'ar') return htmlLang;
  const navLang = navigator.language?.slice(0, 2).toLowerCase();
  if (navLang === 'en' || navLang === 'fr' || navLang === 'ar') return navLang;
  return 'en';
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`RAG API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export async function chat(message: string | null, locale?: string): Promise<ChatResponse> {
  return apiFetch<ChatResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify({
      session_id: getSessionId(),
      message,
      locale: locale ?? detectLocale(),
    }),
  });
}

export async function getFaq(locale?: string): Promise<FaqItem[]> {
  const loc = locale ?? detectLocale();
  const data = await apiFetch<{ locale: string; count: number; items: FaqItem[] }>(
    `/faq?locale=${loc}`,
  );
  return data.items;
}

export async function sendFeedback(
  turnId: string,
  helpful: boolean,
  comment?: string,
): Promise<void> {
  await apiFetch('/feedback', {
    method: 'POST',
    body: JSON.stringify({ turn_id: turnId, helpful, comment }),
  });
}

export async function clearHistory(): Promise<void> {
  await fetch(`${API_BASE}/history`, { method: 'DELETE', credentials: 'include' });
}