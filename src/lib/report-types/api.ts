import { apiClient } from '@/lib/api/client';
import type {
  ReportTypeRequest,
  ReportTypeResponse,
  ReportTypeTreeNode,
} from '@/types/report-type';

export function list(): Promise<ReportTypeResponse[]> {
  return apiClient.get<ReportTypeResponse[]>('/report-types');
}

export function tree(): Promise<ReportTypeTreeNode[]> {
  return apiClient.get<ReportTypeTreeNode[]>('/report-types/tree');
}

export function get(id: number): Promise<ReportTypeResponse> {
  return apiClient.get<ReportTypeResponse>(`/report-types/${id}`);
}

export function children(id: number): Promise<ReportTypeResponse[]> {
  return apiClient.get<ReportTypeResponse[]>(`/report-types/${id}/children`);
}

export function create(body: ReportTypeRequest): Promise<ReportTypeResponse> {
  return apiClient.post<ReportTypeResponse>('/report-types', body);
}

export function update(id: number, body: ReportTypeRequest): Promise<ReportTypeResponse> {
  return apiClient.put<ReportTypeResponse>(`/report-types/${id}`, body);
}

export function remove(id: number): Promise<void> {
  return apiClient.delete<void>(`/report-types/${id}`);
}
