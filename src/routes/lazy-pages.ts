import { lazy } from 'react';

/**
 * Central registry of code-split page components. Add one export per
 * route here — never inline React.lazy() calls inside routes.tsx or JSX.
 */
export const LoginPage = lazy(() =>
  import('@/pages/auth/login-page').then((m) => ({ default: m.LoginPage })),
);

export const AdminUsersListPage = lazy(() =>
  import('@/pages/admin/users/users-list-page').then((m) => ({ default: m.UsersListPage })),
);

export const ReportTypesListPage = lazy(() =>
  import('@/pages/report-types/report-types-list-page').then((m) => ({
    default: m.ReportTypesListPage,
  })),
);

export const ReportTypesTreePage = lazy(() =>
  import('@/pages/report-types/report-types-tree-page').then((m) => ({
    default: m.ReportTypesTreePage,
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
