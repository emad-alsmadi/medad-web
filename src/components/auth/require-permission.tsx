import { Navigate, Outlet } from 'react-router-dom';
import { useCan } from '@/hooks/auth/use-can';
import { ROUTES } from '@/constant/routes';
import type { Action, Resource } from '@/types/role';

interface RequirePermissionProps {
  resource: Resource;
  action: Action;
}

/**
 * Second layer of route protection, always nested under RequireAuth:
 * blocks the routes under it unless the user's role grants
 * `resource:action`. Sends them to `/` (HomeRedirect picks the first page
 * they may open) rather than /login, since they ARE authenticated.
 */
export function RequirePermission({ resource, action }: RequirePermissionProps) {
  const can = useCan();

  if (!can(resource, action)) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
}
