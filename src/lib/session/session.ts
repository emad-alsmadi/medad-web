import type { Session } from '@/types/auth';
import { getCookie, removeCookie, setCookie } from '@/lib/cookies/cookies';

/**
 * Session storage strategy.
 *
 * IMPORTANT: only a short-lived access token reference is kept
 * client-side. No PII (name/email/etc.) is persisted to storage — the
 * authenticated user profile is held in memory only (see lib/auth) and
 * re-fetched on reload via /me. This avoids leaking citizen data into
 * cookies/localStorage that could be read by other scripts or persist
 * on shared machines.
 */
const SESSION_TOKEN_COOKIE = 'medad_session_token';

export function persistAccessToken(token: string): void {
  setCookie(SESSION_TOKEN_COOKIE, token, { days: 1, sameSite: 'Strict', secure: true });
}

export function readAccessToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE);
}

export function clearSession(): void {
  removeCookie(SESSION_TOKEN_COOKIE);
}

export function isSessionValid(session: Session | null): session is Session {
  return session !== null && session.expiresAt > Date.now();
}
