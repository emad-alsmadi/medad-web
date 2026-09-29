import { apiClient } from '@/lib/api/client';
import type { CreateUserRequest, ReportInfo, UserResponse } from '@/types/user';

/**
 * Pure API functions — no react-query, no caching logic. hooks/users
 * wraps these with useQuery/useMutation. Never import this directly from
 * a component. `/users` is a plain array (`List<UserResponse>`), not paginated.
 */
export function list(): Promise<UserResponse[]> {
  return apiClient.get<UserResponse[]>('/users');
}

/** Creates an account with a chosen role; `/auth/register` (lib/auth) always assigns «مستخدم». */
export function create(body: CreateUserRequest): Promise<UserResponse> {
  return apiClient.post<UserResponse>('/users', body);
}

export function get(id: number): Promise<UserResponse> {
  return apiClient.get<UserResponse>(`/users/${id}`);
}

/** The signed-in user, the only response that carries `permissions`. */
export function me(): Promise<UserResponse> {
  return apiClient.get<UserResponse>('/users/me');
}

export function setRole(id: number, roleId: number): Promise<UserResponse> {
  return apiClient.put<UserResponse>(`/users/${id}/role`, { roleId });
}

/** A disabled account loses access at once, its current tokens included. */
export function setEnabled(id: number, enabled: boolean): Promise<UserResponse> {
  return apiClient.put<UserResponse>(`/users/${id}/enabled`, { enabled });
}

export function setMyReportInfo(body: ReportInfo): Promise<UserResponse> {
  return apiClient.put<UserResponse>('/users/me/report-info', body);
}

export function setReportInfo(id: number, body: ReportInfo): Promise<UserResponse> {
  return apiClient.put<UserResponse>(`/users/${id}/report-info`, body);
}

export function remove(id: number): Promise<void> {
  return apiClient.delete<void>(`/users/${id}`);
}
