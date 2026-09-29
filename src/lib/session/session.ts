import type { AuthUser } from '@/types/auth';
import { getCookie, removeCookie, setCookie } from '@/lib/cookies/cookies';

/**
 * Session storage strategy.
 *
 * Tokens live in cookies with the backend's documented lifetimes (access
 * 24h, refresh 30d). The user cookie is only a snapshot for an instant
 * first paint after a reload — GET /users/me (hooks/auth/use-session) is
 * the source of truth and rewrites it, since the backend applies role and
 * permission changes immediately. It is kept for the same 30 days so it
 * never expires before the refresh token that lets a session continue.
 */
const TOKEN_COOKIE = 'medad_session_token';
const REFRESH_TOKEN_COOKIE = 'medad_refresh_token';
const USER_COOKIE = 'medad_session_user';

const TOKEN_DAYS = 1;
const REFRESH_DAYS = 30;

const COOKIE_OPTIONS = { sameSite: 'Strict', secure: true } as const;

interface PersistSessionInput {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export function persistSession({ user, token, refreshToken }: PersistSessionInput): void {
  updateTokens({ token, refreshToken });
  persistSessionUser(user);
}

export function persistSessionUser(user: AuthUser): void {
  setCookie(USER_COOKIE, JSON.stringify(user), { days: REFRESH_DAYS, ...COOKIE_OPTIONS });
}

export function updateTokens({
  token,
  refreshToken,
}: {
  token: string;
  refreshToken: string;
}): void {
  setCookie(TOKEN_COOKIE, token, { days: TOKEN_DAYS, ...COOKIE_OPTIONS });
  setCookie(REFRESH_TOKEN_COOKIE, refreshToken, { days: REFRESH_DAYS, ...COOKIE_OPTIONS });
}

export function readAccessToken(): string | null {
  return getCookie(TOKEN_COOKIE);
}

export function readRefreshToken(): string | null {
  return getCookie(REFRESH_TOKEN_COOKIE);
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') return false;
  const user = value as Partial<AuthUser>;
  return (
    typeof user.id === 'number' &&
    (user.role === null || typeof user.role === 'object') &&
    typeof user.permissions === 'object' &&
    user.permissions !== null
  );
}

/**
 * Null for a snapshot from before roles became objects with permissions —
 * the tokens are left alone, so the session carries on and /users/me
 * rewrites the snapshot instead of signing the user out.
 */
export function readSessionUser(): AuthUser | null {
  const raw = getCookie(USER_COOKIE);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isAuthUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  removeCookie(TOKEN_COOKIE);
  removeCookie(REFRESH_TOKEN_COOKIE);
  removeCookie(USER_COOKIE);
}
