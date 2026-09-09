import { useQueryClient } from '@tanstack/react-query';
import { clearSession } from '@/lib/session/session';
import { notify } from '@/lib/notifications/toast';
import { ROUTES } from '@/constant/routes';

/**
 * No /auth/logout endpoint exists — the backend is stateless (JWT), so
 * logging out is purely a client-side session clear.
 *
 * The redirect to /login is a hard navigation (not react-router's
 * `navigate`) on purpose: it guarantees every in-memory store, query
 * cache, and component-local state is thrown away and re-initialized
 * from scratch, so there is no window where a stale render of a
 * protected page can flash before the route guard re-evaluates. This is
 * the same mechanism the forced-logout path in lib/api/client.ts uses on
 * a rejected/expired session, so there is exactly one way the app ever
 * leaves an authenticated session.
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    clearSession();
    queryClient.clear();
    notify.success('تم تسجيل الخروج بنجاح.');
    // Same short delay as the forced-logout path in lib/api/client.ts: a
    // hard navigation unmounts React immediately, so without it the toast
    // never gets a chance to paint before the browser leaves the page.
    window.setTimeout(() => {
      window.location.href = ROUTES.login;
    }, 600);
  };
}
