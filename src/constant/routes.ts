/**
 * Centralized route path constants. Import these instead of hardcoding
 * path strings in <Link>/navigate() calls.
 */
export const ROUTES = {
  home: '/',
  login: '/login',
  admin: {
    dashboard: '/admin',
    users: '/admin/users',
    settings: '/admin/settings',
  },
} as const;
