/**
 * Shared auth/session types, matching the real backend contract: only
 * ADMIN/USER roles, and the user profile is only ever available from the
 * /auth/login (or /auth/register) response — there is no /auth/me.
 */
export type UserRole = 'ADMIN' | 'USER';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface Session {
  user: AuthUser;
  token: string;
  refreshToken: string;
}
