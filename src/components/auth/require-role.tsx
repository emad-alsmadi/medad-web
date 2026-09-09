import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '@/contexts/auth-context';
import type { UserRole } from '@/types/auth';
import { ROUTES } from '@/constant/routes';

interface RequireRoleProps {
  allowedRoles: UserRole[];
}

/**
 * Second layer of route protection: assumes RequireAuth has already
 * guaranteed a logged-in user, and blocks access to routes nested under
 * it when that user's role isn't in `allowedRoles`. Sends them back to
 * the dashboard rather than /login, since they ARE authenticated — they
 * just picked (or bookmarked) a section they have no permission for.
 *
 * Always compose this under RequireAuth in the route tree — it does not
 * re-check authentication itself, only authorization.
 */
export function RequireRole({ allowedRoles }: RequireRoleProps) {
  const { user } = useAuthContext();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
}
