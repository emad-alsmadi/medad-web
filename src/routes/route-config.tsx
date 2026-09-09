import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts/admin-layout';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import { RequireAuth } from '@/components/auth/require-auth';
import { RequireRole } from '@/components/auth/require-role';
import { GuestOnlyRoute } from '@/components/auth/guest-only-route';
import { RouteFallback } from '@/components/common/route-fallback';
import { ROUTES } from '@/constant/routes';
import {
  AdminUsersListPage,
  LoginPage,
  ReportDetailPage,
  ReportFormPage,
  ReportsListPage,
  ReportTypesListPage,
  ReportTypesTreePage,
} from '@/routes/lazy-pages';

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

/**
 * Single source of truth for the route tree. Add new routes here (with
 * the page component registered in lazy-pages.ts) instead of scattering
 * <Route> JSX across the app.
 *
 * Route protection is layered, each guard doing exactly one job:
 *   - GuestOnlyRoute: only reachable when logged OUT (bounces an
 *     authenticated user straight to the dashboard).
 *   - RequireAuth: only reachable when logged IN (bounces to /login,
 *     remembering where the visitor was headed).
 *   - RequireRole: nested under RequireAuth — further restricts a branch
 *     of already-authenticated routes to specific roles.
 * Every route below is covered by exactly one of these; there is no
 * page that falls through unprotected.
 */
export const routeConfig: RouteObject[] = [
  {
    element: <GuestOnlyRoute />,
    children: [{ path: ROUTES.login, element: withSuspense(<LoginPage />) }],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireRole allowedRoles={['ADMIN', 'USER']} />,
        children: [
          {
            element: <AuthenticatedLayout />,
            children: [
              { path: ROUTES.home, element: <Navigate to={ROUTES.reports.list} replace /> },
              { path: ROUTES.reports.list, element: withSuspense(<ReportsListPage />) },
              { path: ROUTES.reports.create, element: withSuspense(<ReportFormPage />) },
              {
                path: ROUTES.reports.detail(':id'),
                element: withSuspense(<ReportDetailPage />),
              },
              { path: ROUTES.reports.edit(':id'), element: withSuspense(<ReportFormPage />) },
              { path: ROUTES.reportTypes.list, element: withSuspense(<ReportTypesListPage />) },
              { path: ROUTES.reportTypes.tree, element: withSuspense(<ReportTypesTreePage />) },
            ],
          },
        ],
      },
      {
        element: <RequireRole allowedRoles={['ADMIN']} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: ROUTES.admin.users, element: withSuspense(<AdminUsersListPage />) },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={ROUTES.home} replace /> },
];
