import { apiClient } from '@/lib/api/client';
import type { FormTypeRequest, FormTypeResponse, FormTypeTreeNode } from '@/types/form-type';

export function list(): Promise<FormTypeResponse[]> {
  return apiClient.get<FormTypeResponse[]>('/form-types');
}

export function tree(): Promise<FormTypeTreeNode[]> {
  return apiClient.get<FormTypeTreeNode[]>('/form-types/tree');
}

/** Top-level types only, each with its sub-type count — for the roots step of a cascading select. */
export function roots(): Promise<FormTypeResponse[]> {
  return apiClient.get<FormTypeResponse[]>('/form-types/roots');
}

export function get(id: number): Promise<FormTypeResponse> {
  return apiClient.get<FormTypeResponse>(`/form-types/${id}`);
}

export function children(id: number): Promise<FormTypeResponse[]> {
  return apiClient.get<FormTypeResponse[]>(`/form-types/${id}/children`);
}

export function create(body: FormTypeRequest): Promise<FormTypeResponse> {
  return apiClient.post<FormTypeResponse>('/form-types', body);
}

export function update(id: number, body: FormTypeRequest): Promise<FormTypeResponse> {
  return apiClient.put<FormTypeResponse>(`/form-types/${id}`, body);
}

export function remove(id: number): Promise<void> {
  return apiClient.delete<void>(`/form-types/${id}`);
}
