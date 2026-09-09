import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/auth-context';
import { ROUTES } from '@/constant/routes';
import { readAccessToken } from '@/lib/session/session';

/**
 * First layer of route protection: blocks any unauthenticated visitor
 * from every route nested under it, redirecting to /login and
 * remembering the page they were trying to reach (so a post-login
 * redirect can send them back instead of always landing on the
 * dashboard).
 *
 * Checks both the react-query-backed auth context AND the raw
 * access-token cookie. The cookie check matters because it is
 * re-evaluated on every navigation (this component re-runs each time
 * react-router matches it), so a session cleared outside the app's own
 * logout flow — cookie expired, deleted via devtools, cleared in another
 * tab — is caught on the very next route change instead of trusting a
 * context value that only updates when its own query cache changes.
 */
export function RequireAuth() {
  const { user, isLoading, isAuthenticated } = useAuthContext();
  const location = useLocation();
  const hasToken = Boolean(readAccessToken());

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user || !hasToken) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
