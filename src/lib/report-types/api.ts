import { apiClient } from '@/lib/api/client';
import type {
  ReportTypeRequest,
  ReportTypeResponse,
  ReportTypeRoot,
  ReportTypeTreeNode,
} from '@/types/report-type';

export function list(): Promise<ReportTypeResponse[]> {
  return apiClient.get<ReportTypeResponse[]>('/report-types');
}

export function tree(): Promise<ReportTypeTreeNode[]> {
  return apiClient.get<ReportTypeTreeNode[]>('/report-types/tree');
}

/** Top-level types only, each with its sub-type count — for the roots step of a cascading select. */
export function roots(): Promise<ReportTypeRoot[]> {
  return apiClient.get<ReportTypeRoot[]>('/report-types/roots');
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
