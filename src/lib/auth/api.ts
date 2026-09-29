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

export interface LoginResponse extends AuthUser {
  token: string;
  refreshToken: string;
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** The session user out of a response that also carries tokens. */
export function toAuthUser({ id, fullName, email, role, permissions }: LoginResponse): AuthUser {
  return { id, fullName, email, role, permissions };
}

export function login(payload: LoginPayload): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>('/auth/login', payload);
}

/**
 * Signs out every other session of this user (their tokens stop working) and returns fresh
 * tokens for this one. 400 for a wrong current password, 429 after too many of them.
 */
export function changePassword(payload: ChangePasswordPayload): Promise<LoginResponse> {
  return apiClient.put<LoginResponse>('/users/me/password', payload);
}

/** Needs USERS:CREATE; the new account always gets the built-in «مستخدم» role. */
export function register(payload: RegisterRequest): Promise<UserResponse> {
  return apiClient.post<UserResponse>('/auth/register', payload);
}
