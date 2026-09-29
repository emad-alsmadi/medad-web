import type { Action, PermissionOption, Permissions, Resource, RoleSummary } from '@/types/role';

export function can(
  permissions: Permissions | null | undefined,
  resource: Resource,
  action: Action,
): boolean {
  return permissions?.[resource]?.includes(action) ?? false;
}

export function roleLabel(role: RoleSummary | null | undefined): string {
  return role?.name ?? 'بدون دور';
}

/**
 * Whether `granted` holds any permission `held` lacks. The backend refuses
 * (403, API guide §4.4) to grant, assign or act on such a role, so the UI
 * disables those choices up front instead of letting the request fail.
 */
export function exceedsPermissions(
  granted: Partial<Permissions>,
  held: Permissions | null | undefined,
): boolean {
  return (Object.entries(granted) as [Resource, Action[] | undefined][]).some(
    ([resource, actions]) => (actions ?? []).some((action) => !can(held, resource, action)),
  );
}

export type PermissionSet = Partial<Record<Resource, Action[]>>;

const has = (set: PermissionSet, resource: Resource, action: Action) =>
  set[resource]?.includes(action) ?? false;

const requiresPair = (option: PermissionOption, resource: Resource, action: Action) =>
  option.requires[resource]?.includes(action) ?? false;

/**
 * The granted permissions in `set` whose screens need `resource:action`
 * (the `requires` of GET /roles/options, API guide §4.5). While any is
 * granted, the role editor keeps `resource:action` too.
 */
export function requiredBy(
  set: PermissionSet,
  options: PermissionOption[],
  resource: Resource,
  action: Action,
): PermissionOption[] {
  return options.filter(
    (option) =>
      has(set, option.resource, option.action) &&
      !(option.resource === resource && option.action === action) &&
      requiresPair(option, resource, action),
  );
}

/**
 * `set` plus everything its permissions require, followed through chains
 * of requirements — only what `held` may grant, since the backend refuses
 * (403) to grant more than the editor holds.
 */
export function withRequiredPermissions(
  set: PermissionSet,
  options: PermissionOption[],
  held: Permissions | null | undefined,
): PermissionSet {
  const next: PermissionSet = { ...set };
  let changed = true;
  while (changed) {
    changed = false;
    for (const option of options) {
      if (!has(next, option.resource, option.action)) continue;
      for (const [resource, actions] of Object.entries(option.requires) as [Resource, Action[]][]) {
        for (const action of actions) {
          if (!has(next, resource, action) && can(held, resource, action)) {
            next[resource] = [...(next[resource] ?? []), action];
            changed = true;
          }
        }
      }
    }
  }
  return next;
}
