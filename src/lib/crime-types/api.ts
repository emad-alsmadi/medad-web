import { apiClient } from '@/lib/api/client';
import type { CrimeTypeRequest, CrimeTypeResponse } from '@/types/crime-type';

/** All crime types, in insertion order. Not paginated. */
export function list(): Promise<CrimeTypeResponse[]> {
  return apiClient.get<CrimeTypeResponse[]>('/crime-types');
}

export function create(body: CrimeTypeRequest): Promise<CrimeTypeResponse> {
  return apiClient.post<CrimeTypeResponse>('/crime-types', body);
}

export function update(id: number, body: CrimeTypeRequest): Promise<CrimeTypeResponse> {
  return apiClient.put<CrimeTypeResponse>(`/crime-types/${id}`, body);
}

export function remove(id: number): Promise<void> {
  return apiClient.delete<void>(`/crime-types/${id}`);
}
