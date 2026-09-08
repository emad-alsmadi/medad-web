import type { AuthUser } from '@/types/auth';
import { getCookie, removeCookie, setCookie } from '@/lib/cookies/cookies';

/**
 * Session storage strategy.
 *
 * The backend has no `/auth/me` — the authenticated user's profile is
 * only ever returned once, from `/auth/login` (or `/auth/register`), so
 * it must be persisted client-side to survive a reload rather than
 * re-fetched. Token (24h) and refresh token (30d) lifetimes mirror the
 * backend's documented expirations; the user cookie is kept for the same
 * 30 days so it never expires before the refresh token that would
 * otherwise let a session silently continue.
 */
const TOKEN_COOKIE = 'medad_session_token';
const REFRESH_TOKEN_COOKIE = 'medad_refresh_token';
const USER_COOKIE = 'medad_session_user';

const TOKEN_DAYS = 1;
const REFRESH_DAYS = 30;

interface PersistSessionInput {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export function persistSession({ user, token, refreshToken }: PersistSessionInput): void {
  setCookie(TOKEN_COOKIE, token, { days: TOKEN_DAYS, sameSite: 'Strict', secure: true });
  setCookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    days: REFRESH_DAYS,
    sameSite: 'Strict',
    secure: true,
  });
  setCookie(USER_COOKIE, JSON.stringify(user), {
    days: REFRESH_DAYS,
    sameSite: 'Strict',
    secure: true,
  });
}

export function updateTokens({
  token,
  refreshToken,
}: {
  token: string;
  refreshToken: string;
}): void {
  setCookie(TOKEN_COOKIE, token, { days: TOKEN_DAYS, sameSite: 'Strict', secure: true });
  setCookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    days: REFRESH_DAYS,
    sameSite: 'Strict',
    secure: true,
  });
}

export function readAccessToken(): string | null {
  return getCookie(TOKEN_COOKIE);
}

export function readRefreshToken(): string | null {
  return getCookie(REFRESH_TOKEN_COOKIE);
}

export function readSessionUser(): AuthUser | null {
  const raw = getCookie(USER_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  removeCookie(TOKEN_COOKIE);
  removeCookie(REFRESH_TOKEN_COOKIE);
  removeCookie(USER_COOKIE);
}
