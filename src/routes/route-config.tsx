import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts/admin-layout';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import { RoleGuard } from '@/components/auth/role-guard';
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
 */
export const routeConfig: RouteObject[] = [
  {
    path: ROUTES.login,
    element: withSuspense(<LoginPage />),
  },
  {
    element: <RoleGuard allowedRoles={['ADMIN', 'USER']} />,
    children: [
      {
        element: <AuthenticatedLayout />,
        children: [
          { path: ROUTES.home, element: <Navigate to={ROUTES.reports.list} replace /> },
          { path: ROUTES.reports.list, element: withSuspense(<ReportsListPage />) },
          { path: ROUTES.reports.create, element: withSuspense(<ReportFormPage />) },
          { path: ROUTES.reports.detail(':id'), element: withSuspense(<ReportDetailPage />) },
          { path: ROUTES.reports.edit(':id'), element: withSuspense(<ReportFormPage />) },
          { path: ROUTES.reportTypes.list, element: withSuspense(<ReportTypesListPage />) },
          { path: ROUTES.reportTypes.tree, element: withSuspense(<ReportTypesTreePage />) },
        ],
      },
    ],
  },
  {
    element: <RoleGuard allowedRoles={['ADMIN']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [{ path: ROUTES.admin.users, element: withSuspense(<AdminUsersListPage />) }],
      },
    ],
  },
];
