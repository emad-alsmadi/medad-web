import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '@/contexts/auth-context';
import type { UserRole } from '@/types/auth';
import { ROUTES } from '@/constant/routes';

interface RoleGuardProps {
  allowedRoles: UserRole[];
}

/**
 * Route guard: blocks unauthenticated users and users whose role isn't
 * allowed for this branch of the route tree. Compose per-role route
 * groups with this instead of checking roles inside pages/components.
 */
export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuthContext();

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
