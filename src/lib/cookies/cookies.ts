/**
 * Thin cookie access layer. Kept centralized so auth/session code never
 * touches `document.cookie` directly — makes it easy to audit what the
 * app reads/writes, and to swap the mechanism later (e.g. httpOnly
 * cookies set by the server instead of client-readable ones).
 */

interface CookieOptions {
  days?: number;
  path?: string;
  sameSite?: 'Strict' | 'Lax' | 'None';
  secure?: boolean;
}

export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  const { days = 7, path = '/', sameSite = 'Strict', secure = true } = options;

  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  const secureFlag = secure ? '; Secure' : '';

  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${path}; SameSite=${sameSite}${secureFlag}`;
}

export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1] ?? '') : null;
}

export function removeCookie(name: string, path = '/'): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
}
