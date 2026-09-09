import { env } from '@/lib/env/env';
import { ROUTES } from '@/constant/routes';
import {
  clearSession,
  readAccessToken,
  readRefreshToken,
  updateTokens,
} from '@/lib/session/session';
import { notify } from '@/lib/notifications/toast';

let isForcingLogout = false;

/**
 * Forces the app back to the login page when the session itself is gone
 * or rejected (401 with no usable/valid refresh token — i.e. the access
 * token is invalid and there is no way to silently recover it). A hard
 * navigation (not react-router) because this runs outside React, and it
 * also guarantees every in-memory store/query cache is reset.
 *
 * Deliberately NOT triggered by a bare 403: that status means the
 * session is valid but the backend denied this specific action (e.g. a
 * USER trying to delete someone else's report) — that's an
 * authorization decision the calling mutation/query should surface with
 * its own message (see onError handlers in hooks/**), not a reason to
 * end the whole session.
 *
 * Guarded against firing more than once per page load — a burst of
 * parallel requests that all fail auth at the same time (e.g. every
 * widget on the dashboard refetching after an expired token) would
 * otherwise stack duplicate toasts and redirects.
 */
function forceLogoutRedirect(): void {
  if (isForcingLogout || window.location.pathname === ROUTES.login) return;
  isForcingLogout = true;

  clearSession();
  notify.warning('انتهت جلستك. يرجى تسجيل الدخول من جديد.');
  // A hard navigation (window.location.href) unmounts the whole React tree
  // immediately, including the toast that was just triggered — without this
  // delay the browser leaves the page before the toast ever paints. The
  // delay is short enough not to feel like a stall but long enough for the
  // toast's mount animation to complete.
  window.setTimeout(() => {
    window.location.href = ROUTES.login;
  }, 600);
}

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
  const isAuthPath = NO_REFRESH_PATHS.some((p) => path.startsWith(p));

  try {
    return await performFetch<TResponse>(path, options);
  } catch (error) {
    const canRetry = !options._isRetry && !isAuthPath;

    if (error instanceof ApiError && error.status === 401 && canRetry) {
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        await refreshPromise;
        return await performFetch<TResponse>(path, { ...options, _isRetry: true });
      } catch (retryError) {
        forceLogoutRedirect();
        throw retryError;
      }
    }

    if (error instanceof ApiError && error.status === 401 && !isAuthPath) {
      forceLogoutRedirect();
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
