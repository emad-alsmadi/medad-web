import { apiClient } from '@/lib/api/client';
import type { AuthUser } from '@/types/auth';

/**
 * Pure API functions for auth. No react-query here — hooks/auth wraps
 * these with useQuery/useMutation.
 */
interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  expiresAt: number;
}

export function login(payload: LoginPayload): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>('/auth/login', payload);
}

export function logout(): Promise<void> {
  return apiClient.post<void>('/auth/logout');
}

export function fetchCurrentUser(): Promise<AuthUser> {
  return apiClient.get<AuthUser>('/auth/me');
}
