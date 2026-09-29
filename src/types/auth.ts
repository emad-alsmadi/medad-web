import type { Permissions, RoleSummary } from '@/types/role';

/**
 * The signed-in user as the app needs it for navigation and permission
 * checks — from /auth/login, then kept in sync with GET /users/me.
 */
export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: RoleSummary | null;
  permissions: Permissions;
}

export interface Session {
  user: AuthUser;
  token: string;
  refreshToken: string;
}
