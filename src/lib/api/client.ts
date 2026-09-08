import { env } from '@/lib/env/env';
import {
  clearSession,
  readAccessToken,
  readRefreshToken,
  updateTokens,
} from '@/lib/session/session';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Internal: set on the retry attempt to prevent a second refresh loop. */
  _isRetry?: boolean;
}

interface RefreshResponse {
  token: string;
  refreshToken: string;
}

const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/register'];

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = readRefreshToken();
  if (!refreshToken) {
    throw new ApiError('No refresh token available', 401);
  }

  const response = await fetch(`${env.VITE_API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new ApiError('Failed to refresh token', response.status);
  }

  const data = (await response.json()) as RefreshResponse;
  updateTokens(data);
  return data.token;
}

async function performFetch<TResponse>(path: string, options: RequestOptions): Promise<TResponse> {
  const token = readAccessToken();

  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${env.VITE_API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  });

  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      details = undefined;
    }
    throw new ApiError(`Request failed with status ${response.status}`, response.status, details);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

/**
 * Single fetch wrapper used by every lib/**\/api.ts file. Keeps auth
 * headers, base URL, JSON handling, error normalization, and
 * refresh-on-401 retry in one place — never call `fetch` directly from
 * feature code.
 */
async function request<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  try {
    return await performFetch<TResponse>(path, options);
  } catch (error) {
    const canRetry = !options._isRetry && !NO_REFRESH_PATHS.some((p) => path.startsWith(p));

    if (error instanceof ApiError && error.status === 401 && canRetry) {
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        await refreshPromise;
      } catch {
        clearSession();
        throw error;
      }
      return performFetch<TResponse>(path, { ...options, _isRetry: true });
    }

    throw error;
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
