import { apiClient } from '@/lib/api/client';
import type { ReportInfo, UserResponse } from '@/types/user';

/**
 * Pure API functions — no react-query, no caching logic. hooks/users
 * wraps these with useQuery/useMutation. Never import this directly from
 * a component. `/users` is a plain array, not paginated.
 */
export function list(): Promise<UserResponse[]> {
  return apiClient.get<UserResponse[]>('/users');
}

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
