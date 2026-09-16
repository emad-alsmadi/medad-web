import { lazy } from 'react';

/**
 * Central registry of code-split page components. Add one export per
 * route here — never inline React.lazy() calls inside routes.tsx or JSX.
 */
export const LoginPage = lazy(() =>
  import('@/pages/auth/login-page').then((m) => ({ default: m.LoginPage })),
);

export const ProfilePage = lazy(() =>
  import('@/pages/profile/profile-page').then((m) => ({ default: m.ProfilePage })),
);

export const AdminUsersListPage = lazy(() =>
  import('@/pages/admin/users/users-list-page').then((m) => ({ default: m.UsersListPage })),
);

export const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/dashboard/dashboard-page').then((m) => ({ default: m.DashboardPage })),
);

export const ReportTypesListPage = lazy(() =>
  import('@/pages/report-types/report-types-list-page').then((m) => ({
    default: m.ReportTypesListPage,
  })),
);

export const ReportsListPage = lazy(() =>
  import('@/pages/reports/reports-list-page').then((m) => ({ default: m.ReportsListPage })),
);

export const ReportDetailPage = lazy(() =>
  import('@/pages/reports/report-detail-page').then((m) => ({ default: m.ReportDetailPage })),
);

export const ReportFormPage = lazy(() =>
  import('@/pages/reports/report-form-page').then((m) => ({ default: m.ReportFormPage })),
);

export const NotFoundPage = lazy(() =>
  import('@/pages/not-found/not-found-page').then((m) => ({ default: m.NotFoundPage })),
);
