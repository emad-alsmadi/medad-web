import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { useAuthContext } from '@/contexts/auth-context';
import { ROUTES } from '@/constant/routes';
import { readAccessToken } from '@/lib/session/session';

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

  // Must agree with RequireAuth's definition of "authenticated" (context
  // state AND a usable access-token cookie). Otherwise a state where the
  // context still says "logged in" but the token cookie is missing or
  // expired — e.g. it never got set on a non-HTTPS origin, or it expired
  // while the longer-lived user/refresh cookies haven't — makes the two
  // guards disagree: RequireAuth bounces to /login, this one bounces
  // straight back, forever ("Maximum update depth exceeded").
  const hasToken = Boolean(readAccessToken());

  if (isAuthenticated && hasToken) {
    const from = (location.state as LocationState | null)?.from;
    // Guard against redirecting back into /login itself: if `from` ever
    // points at a guest-only route (e.g. a stale history state carried
    // over from an earlier redirect), honoring it would send an
    // authenticated visitor straight back to this same component, which
    // recomputes the same redirect on every render — an infinite
    // "Maximum update depth exceeded" loop between GuestOnlyRoute and
    // itself instead of a single one-time redirect.
    const target = from && from.pathname !== ROUTES.login ? `${from.pathname}${from.search}` : ROUTES.home;
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
