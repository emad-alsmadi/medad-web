import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { useAuthContext } from '@/contexts/auth-context';
import { ROUTES } from '@/constant/routes';

interface LocationState {
  from?: Location;
}

/**
 * Inverse of RequireAuth: for routes that only make sense when logged
 * OUT (currently just /login). An already-authenticated user hitting
 * this route — by navigating back, editing the URL, submitting the
 * login form, or a stale bookmark — is bounced straight to the
 * dashboard instead of being shown the login form again.
 *
 * This is the single place that decides where a "no longer a guest"
 * visitor goes: it honors the same `location.state.from` that
 * RequireAuth attaches when it originally sent someone to /login, so a
 * deep link into a protected page survives the login round-trip instead
 * of always dropping the visitor on the dashboard. LoginPage itself does
 * not duplicate this redirect — if it did, both this guard (wrapping the
 * route from outside) and the page (rendering inside it) would compute
 * competing <Navigate> targets on the same auth-state change, and
 * whichever sits higher in the tree — this one — silently wins, making
 * the inner one dead code.
 */
export function GuestOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    const from = (location.state as LocationState | null)?.from;
    const redirectTo = from ? `${from.pathname}${from.search}` : ROUTES.home;
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
