export function parseStrictJSON<T>(content: string): T {
  return JSON.parse(content) as T;
}

export function tryRepairJSON(raw: string): string {
  const trimmed = raw.trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return trimmed.slice(first, last + 1);
  }
  return trimmed;
}

export function safeJSONParse<T>(content: string): T | null {
  try {
    return parseStrictJSON<T>(content);
  } catch {
    try {
      return parseStrictJSON<T>(tryRepairJSON(content));
    } catch {
      return null;
    }
  }
}
