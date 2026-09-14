import { apiClient } from '@/lib/api/client';
import { register } from '@/lib/auth/api';
import type { ReportInfo, UserResponse } from '@/types/user';

/**
 * Pure API functions — no react-query, no caching logic. hooks/users
 * wraps these with useQuery/useMutation. Never import this directly from
 * a component. `/users` is a plain array, not paginated.
 */
export function list(): Promise<UserResponse[]> {
  return apiClient.get<UserResponse[]>('/users');
}

/**
 * There is no admin-only "create user" endpoint — the backend only
 * exposes POST /auth/register, which always assigns the USER role
 * server-side (role is never accepted from the client). Re-exported here
 * so the admin users feature can create accounts without importing
 * lib/auth directly.
 */
export const create = register;

export function get(id: string): Promise<UserResponse> {
  return apiClient.get<UserResponse>(`/users/${id}`);
}

export function me(): Promise<UserResponse> {
  return apiClient.get<UserResponse>('/users/me');
}

export function setMyReportInfo(body: ReportInfo): Promise<UserResponse> {
  return apiClient.put<UserResponse>('/users/me/report-info', body);
}

export function setReportInfo(id: string, body: ReportInfo): Promise<UserResponse> {
  return apiClient.put<UserResponse>(`/users/${id}/report-info`, body);
}

export function remove(id: string): Promise<void> {
  return apiClient.delete<void>(`/users/${id}`);
}
