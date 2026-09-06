/**
 * Shared auth/session types. Roles are intentionally left as a
 * placeholder union — adjust to the real backend roles when known.
 */
export type UserRole = 'admin' | 'staff' | 'secretary' | 'public';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface Session {
  user: AuthUser;
  accessToken: string;
  expiresAt: number;
}
