import { lazy } from 'react';

/**
 * Central registry of code-split page components. Add one export per
 * route here — never inline React.lazy() calls inside routes.tsx or JSX.
 */
export const AdminUsersListPage = lazy(() =>
  import('@/pages/admin/users/users-list-page').then((m) => ({ default: m.UsersListPage })),
);
