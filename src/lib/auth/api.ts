import { apiClient } from '@/lib/api/client';
import type { AuthUser } from '@/types/auth';
import type { RegisterRequest, UserResponse } from '@/types/user';

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

export function login(payload: LoginPayload): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>('/auth/login', payload);
}

/** Needs USERS:CREATE; the new account always gets the built-in «مستخدم» role. */
export function register(payload: RegisterRequest): Promise<UserResponse> {
  return apiClient.post<UserResponse>('/auth/register', payload);
}
