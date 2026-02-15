export function repairJsonString(raw: string): string {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

export async function parseJsonWithRetry<T>(producer: () => Promise<string>, retries = 1): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i += 1) {
    try {
      const raw = await producer();
      return JSON.parse(repairJsonString(raw)) as T;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
