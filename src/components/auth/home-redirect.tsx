import { Navigate } from 'react-router-dom';
import { useCan } from '@/hooks/auth/use-can';
import { ROUTES } from '@/constant/routes';
import type { Action, Resource } from '@/types/role';

/** Landing pages in order of preference; the profile is always open, so it ends the list. */
const LANDING_PAGES: { to: string; resource: Resource; action: Action }[] = [
  { to: ROUTES.admin.dashboard, resource: 'REPORTS', action: 'VIEW' },
  { to: ROUTES.reports.list, resource: 'REPORTS', action: 'VIEW' },
  { to: ROUTES.formTypes.list, resource: 'FORM_TYPES', action: 'VIEW' },
  { to: ROUTES.crimeTypes.list, resource: 'CRIME_TYPES', action: 'VIEW' },
  { to: ROUTES.admin.users, resource: 'USERS', action: 'VIEW' },
  { to: ROUTES.admin.roles, resource: 'ROLES', action: 'VIEW' },
];

/**
 * Landing target for `/` — both after login and when RequirePermission
 * turns someone away: the first page their role opens. Never a guarded
 * page they lack, so the two can't bounce between each other.
 */
export function HomeRedirect() {
  const can = useCan();
  const target =
    LANDING_PAGES.find((page) => can(page.resource, page.action))?.to ?? ROUTES.profile;
  return <Navigate to={target} replace />;
}
