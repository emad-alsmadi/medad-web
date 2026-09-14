/**
 * Centralized route path constants. Import these instead of hardcoding
 * path strings in <Link>/navigate() calls.
 */
export const ROUTES = {
  home: '/',
  login: '/login',
  profile: '/profile',
  admin: {
    users: '/admin/users',
  },
  reportTypes: {
    list: '/report-types',
  },
  reports: {
    list: '/reports',
    detail: (id: number | string) => `/reports/${id}`,
    edit: (id: number | string) => `/reports/${id}/edit`,
  },
} as const;
