export function highlightMatch(
  text: string | null | undefined,
  query: string,
): Array<{ text: string; match: boolean }> {
  if (!text) return [];
  const q = query.trim();
  if (!q) return [{ text, match: false }];

  const parts: Array<{ text: string; match: boolean }> = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = q.toLowerCase();

  let cursor = 0;
  while (cursor < text.length) {
    const idx = lowerText.indexOf(lowerQuery, cursor);
    if (idx === -1) {
      parts.push({ text: text.slice(cursor), match: false });
      break;
    }
    if (idx > cursor) {
      parts.push({ text: text.slice(cursor, idx), match: false });
    }
    parts.push({
      text: text.slice(idx, idx + lowerQuery.length),
      match: true,
    });
    cursor = idx + lowerQuery.length;
  }

  return parts;
}