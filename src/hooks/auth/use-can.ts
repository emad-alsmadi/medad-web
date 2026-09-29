import { useCallback } from 'react';
import { useAuthContext } from '@/contexts/auth-context';
import { can } from '@/lib/auth/permissions';
import type { Action, Resource } from '@/types/role';

/**
 * Permission check for rendering decisions (show a link, enable a button).
 * UX only — the backend enforces every permission on its own.
 */
export function useCan(): (resource: Resource, action: Action) => boolean {
  const { user } = useAuthContext();
  const permissions = user?.permissions;
  return useCallback(
    (resource: Resource, action: Action) => can(permissions, resource, action),
    [permissions],
  );
}
