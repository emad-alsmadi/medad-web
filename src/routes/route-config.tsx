import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import { RequireAuth } from '@/components/auth/require-auth';
import { RequirePermission } from '@/components/auth/require-permission';
import { GuestOnlyRoute } from '@/components/auth/guest-only-route';
import { HomeRedirect } from '@/components/auth/home-redirect';
import { RouteFallback } from '@/components/common/route-fallback';
import { ROUTES } from '@/constant/routes';
import type { Action, Resource } from '@/types/role';
import {
  AdminDashboardPage,
  AdminUsersListPage,
  LoginPage,
  NotFoundPage,
  ProfilePage,
  SettingsPage,
  ReportDetailPage,
  ReportFormPage,
  ReportsListPage,
  FormTypesListPage,
  CrimeTypesListPage,
  RolesListPage,
} from '@/routes/lazy-pages';

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

function guarded(resource: Resource, action: Action, children: RouteObject[]): RouteObject {
  return { element: <RequirePermission resource={resource} action={action} />, children };
}

/**
 * Single source of truth for the route tree. Add new routes here (with
 * the page component registered in lazy-pages.ts) instead of scattering
 * <Route> JSX across the app.
 *
 * Route protection is layered, each guard doing exactly one job:
 *   - GuestOnlyRoute: only reachable when logged OUT (bounces an
 *     authenticated user straight to their home page).
 *   - RequireAuth: only reachable when logged IN (bounces to /login,
 *     remembering where the visitor was headed).
 *   - RequirePermission: nested under RequireAuth — each section needs
 *     the permission its page's main request needs on the backend.
 * `/`, the profile and the settings are open to every signed-in user.
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
        element: <AuthenticatedLayout />,
        children: [
          { path: ROUTES.home, element: <HomeRedirect /> },
          { path: ROUTES.profile, element: withSuspense(<ProfilePage />) },
          { path: ROUTES.settings, element: withSuspense(<SettingsPage />) },
          guarded('REPORTS', 'VIEW', [
            { path: ROUTES.admin.dashboard, element: withSuspense(<AdminDashboardPage />) },
            { path: ROUTES.reports.list, element: withSuspense(<ReportsListPage />) },
            {
              path: ROUTES.reports.detail(':id'),
              element: withSuspense(<ReportDetailPage />),
            },
          ]),
          // The edit form picks its form type from /form-types, so it needs that list too.
          guarded('REPORTS', 'UPDATE', [
            guarded('FORM_TYPES', 'VIEW', [
              { path: ROUTES.reports.edit(':id'), element: withSuspense(<ReportFormPage />) },
            ]),
          ]),
          guarded('FORM_TYPES', 'VIEW', [
            { path: ROUTES.formTypes.list, element: withSuspense(<FormTypesListPage />) },
          ]),
          {
            path: ROUTES.formTypes.legacyList,
            element: <Navigate to={ROUTES.formTypes.list} replace />,
          },
          guarded('CRIME_TYPES', 'VIEW', [
            { path: ROUTES.crimeTypes.list, element: withSuspense(<CrimeTypesListPage />) },
          ]),
          {
            path: ROUTES.crimeTypes.legacyList,
            element: <Navigate to={ROUTES.crimeTypes.list} replace />,
          },
          guarded('USERS', 'VIEW', [
            { path: ROUTES.admin.users, element: withSuspense(<AdminUsersListPage />) },
          ]),
          guarded('ROLES', 'VIEW', [
            { path: ROUTES.admin.roles, element: withSuspense(<RolesListPage />) },
          ]),
        ],
      },
    ],
  },
  { path: '*', element: withSuspense(<NotFoundPage />) },
];
