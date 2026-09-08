import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '@/contexts/auth-context';
import type { UserRole } from '@/types/auth';
import { ROUTES } from '@/constant/routes';

interface RoleGuardProps {
  allowedRoles: UserRole[];
}

// DEV ONLY — auth guard bypassed while there's no backend to log in against
// (frontend-only styling/UI pass). Remove this early return before merging.
const BYPASS_AUTH_FOR_DEV = true;

/**
 * Route guard: blocks unauthenticated users and users whose role isn't
 * allowed for this branch of the route tree. Compose per-role route
 * groups with this instead of checking roles inside pages/components.
 */
export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuthContext();

  if (BYPASS_AUTH_FOR_DEV) {
    return <Outlet />;
  }

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
}
