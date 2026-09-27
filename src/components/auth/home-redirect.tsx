import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/auth-context';
import { ROUTES } from '@/constant/routes';

/**
 * Landing target for `/`: sends ADMIN users to the admin dashboard and
 * everyone else to the reports list, so both the post-login redirect
 * (GuestOnlyRoute -> ROUTES.home) and RequireRole's "not authorized"
 * bounce land each role on its own home page instead of always on
 * reports.list.
 */
export function HomeRedirect() {
  const { user } = useAuthContext();
  const target = user?.role === 'ADMIN' ? ROUTES.admin.dashboard : ROUTES.reports.list;
  return <Navigate to={target} replace />;
}
