// src/components/rag/phrases.ts

export const INITIAL_GREETINGS: string[] = [
  "Hi, I'm Sami! Need help finding something? Click me to chat.",
  "Hey there! I'm Sami. Want me to help you compare prices?",
  "Hello! I'm Sami. Looking for a product? I can help.",
  "Hi! I'm Sami, your shopping assistant. Ask me anything.",
  "Welcome! I'm Sami. Need a hand finding the right product?",
];

export const RETURN_GREETINGS: string[] = [
  "Still here if you need me!",
  "No worries — I'm here whenever you're ready.",
  "Take your time. I'll be right here.",
];

export const IDLE_NUDGES: string[] = [
  "Hey, you still there? I can help you find something.",
  "Need a hand? I'm happy to help you compare prices.",
  "Looking for something specific? I can help you search.",
  "Not sure where to start? I can walk you through the site.",
  "Getting lost? Let me point you in the right direction.",
];

export const WAKE_GREETINGS: string[] = [
  "Glad you're back! Need help with anything?",
  "Welcome back! What can I help you with?",
  "You're back! Let me know if you need anything.",
  "Ah, there you are. Anything I can help with?",
];

const FALLBACK_PHRASE = 'How can I help?';

/**
 * Pick a random phrase, never the same one twice in a row.
 *
 * Returns a plain `string` — guaranteed non-empty. If the pool
 * is empty, returns FALLBACK_PHRASE.
 */
export function pickPhrase(
  pool: string[],
  lastUsed?: string,
): string {
  if (pool.length === 0) return FALLBACK_PHRASE;
  if (pool.length === 1) return pool[0] ?? FALLBACK_PHRASE;

  const filtered = lastUsed
    ? pool.filter((p) => p !== lastUsed)
    : pool;

  // filtered can be empty if every item equals lastUsed
  // (shouldn't happen with distinct pools, but guard).
  const source = filtered.length > 0 ? filtered : pool;
  const idx = Math.floor(Math.random() * source.length);
  return source[idx] ?? FALLBACK_PHRASE;
}