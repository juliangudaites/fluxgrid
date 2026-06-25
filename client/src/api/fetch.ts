const DEFAULT_TIMEOUT_MS = 12_000;

export class FetchTimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'FetchTimeoutError';
  }
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const timeoutMs = init?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const { timeoutMs: _t, ...rest } = init ?? {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(input, { ...rest, signal: controller.signal });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const body = err as {
        error?: string;
        details?: string[];
        code?: string;
        sessions?: unknown[];
      };
      const message =
        body.details?.[0] ||
        body.error ||
        `Request failed (${res.status})`;
      const error = new Error(message) as Error & {
        code?: string;
        sessions?: unknown[];
        status?: number;
      };
      error.code = body.code;
      error.sessions = body.sessions;
      error.status = res.status;
      throw error;
    }
    return res.json() as Promise<T>;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new FetchTimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}