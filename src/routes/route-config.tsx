import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { AdminLayout } from '@/layouts/admin-layout';
import { PublicLayout } from '@/layouts/public-layout';
import { RoleGuard } from '@/components/auth/role-guard';
import { RouteFallback } from '@/components/common/route-fallback';
import { ROUTES } from '@/constant/routes';
import { AdminUsersListPage } from '@/routes/lazy-pages';

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

/**
 * Single source of truth for the route tree. Add new routes here (with
 * the page component registered in lazy-pages.ts) instead of scattering
 * <Route> JSX across the app.
 */
export const routeConfig: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [{ path: ROUTES.home, element: withSuspense(<div>Home</div>) }],
  },
  {
    element: <RoleGuard allowedRoles={['admin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [{ path: ROUTES.admin.users, element: withSuspense(<AdminUsersListPage />) }],
      },
    ],
  },
];
