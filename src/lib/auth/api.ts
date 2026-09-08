import { apiClient } from '@/lib/api/client';
import type { AuthUser } from '@/types/auth';
import type { ReportInfo, UserResponse } from '@/types/user';

/**
 * Pure API functions for auth. No react-query here — hooks/auth wraps
 * these with useQuery/useMutation.
 */
interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse extends AuthUser {
  token: string;
  refreshToken: string;
}

interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  reportInfo?: ReportInfo;
}

interface RefreshResponse {
  token: string;
  refreshToken: string;
}

export function login(payload: LoginPayload): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>('/auth/login', payload);
}

/** Not wired to any UI yet — kept for a future admin-invite/self-signup feature. */
export function register(payload: RegisterPayload): Promise<UserResponse> {
  return apiClient.post<UserResponse>('/auth/register', payload);
}

/**
 * Not used by lib/api/client.ts's own refresh-on-401 logic (which inlines
 * a raw fetch to avoid a circular import) — kept for symmetry/manual use.
 */
export function refresh(refreshToken: string): Promise<RefreshResponse> {
  return apiClient.post<RefreshResponse>('/auth/refresh', { refreshToken });
}
