import type { EnumOption } from '@/types/report';

export type Resource = 'REPORTS' | 'FORM_TYPES' | 'CRIME_TYPES' | 'USERS' | 'ROLES';

export type Action = 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE';

/** Every resource is always a key; its value is the actions granted on it. */
export type Permissions = Record<Resource, Action[]>;

export type BuiltInRole = 'ADMIN' | 'USER';

export interface RoleSummary {
  id: number;
  name: string;
  /** null for roles added by an administrator. */
  builtIn: BuiltInRole | null;
}

export interface RoleResponse extends RoleSummary {
  permissions: Permissions;
}

export interface RoleRequest {
  name: string;
  /** A resource left out gets no actions; PUT replaces the whole set. */
  permissions: Partial<Record<Resource, Action[]>>;
}

/** One cell of the permission matrix, explained (API guide §4.1). */
export interface PermissionOption {
  resource: Resource;
  action: Action;
  /** What holding it lets a user do — shown beside the cell. */
  description: string;
  /** What its screens need alongside it; the backend doesn't enforce this, the role editor does. */
  requires: Partial<Record<Resource, Action[]>>;
}

/** GET /roles/options — rows and columns of the permission matrix in display order, and every cell explained. */
export interface RoleOptionsResponse {
  resources: EnumOption<Resource>[];
  actions: EnumOption<Action>[];
  permissions: PermissionOption[];
}
