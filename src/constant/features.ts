/**
 * Switches for pages that are kept in the code but turned off.
 * Flip one back to true to restore its sidebar link and route.
 */
export const FEATURES = {
  /** صفحة المستخدمين: hidden from the sidebar; its route redirects to the dashboard. */
  usersPage: false,
} as const;
