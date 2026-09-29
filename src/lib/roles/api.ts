import { apiClient } from '@/lib/api/client';
import type { RoleOptionsResponse, RoleRequest, RoleResponse } from '@/types/role';

export function list(): Promise<RoleResponse[]> {
  return apiClient.get<RoleResponse[]>('/roles');
}

/** Open to any signed-in user: the resources and actions with their Arabic labels. */
export function options(): Promise<RoleOptionsResponse> {
  return apiClient.get<RoleOptionsResponse>('/roles/options');
}

export function create(body: RoleRequest): Promise<RoleResponse> {
  return apiClient.post<RoleResponse>('/roles', body);
}

/** Replaces the name and the whole permission set. */
export function update(id: number, body: RoleRequest): Promise<RoleResponse> {
  return apiClient.put<RoleResponse>(`/roles/${id}`, body);
}

export function remove(id: number): Promise<void> {
  return apiClient.delete<void>(`/roles/${id}`);
}
