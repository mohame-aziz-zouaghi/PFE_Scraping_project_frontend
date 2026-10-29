// src/components/rag/thinkingPhrases.ts

export const THINKING_PHRASES: string[] = [
  'Hmm, let me think…',
  'Searching the catalog…',
  'Checking prices across stores…',
  'Comparing availability…',
  'Looking that up…',
  'One moment…',
  'Still working on it…',
  'Almost there…',
  'Cross-referencing products…',
  'Piecing it together…',
];

export const THINKING_ROTATE_MS = 1400;

const FALLBACK_PHRASE = 'Thinking…';

/**
 * Return the mumble phrase for the given elapsed milliseconds.
 * Clamps to the last phrase once the list is exhausted.
 * Always returns a plain `string`.
 */
export function phraseForElapsed(elapsedMs: number): string {
  const idx = Math.floor(elapsedMs / THINKING_ROTATE_MS);
  const clamped = Math.min(idx, THINKING_PHRASES.length - 1);
  return THINKING_PHRASES[clamped] ?? FALLBACK_PHRASE;
}