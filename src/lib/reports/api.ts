import { apiClient } from '@/lib/api/client';
import type { Page } from '@/types/api';
import type { ReportListParams, ReportRequest, ReportResponse } from '@/types/report';

const DEFAULT_SORT = 'reportDate,desc';

export function list(params: ReportListParams = {}): Promise<Page<ReportResponse>> {
  const search = new URLSearchParams();
  search.set('page', String(params.page ?? 0));
  search.set('size', String(params.size ?? 20));
  search.set('sort', params.sort ?? DEFAULT_SORT);
  if (params.typeId !== undefined) search.set('typeId', String(params.typeId));
  if (params.creatorId !== undefined) search.set('creatorId', params.creatorId);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);

  return apiClient.get<Page<ReportResponse>>(`/reports?${search.toString()}`);
}

export function get(id: number): Promise<ReportResponse> {
  return apiClient.get<ReportResponse>(`/reports/${id}`);
}

export function create(body: ReportRequest): Promise<ReportResponse> {
  return apiClient.post<ReportResponse>('/reports', body);
}

export function update(id: number, body: ReportRequest): Promise<ReportResponse> {
  return apiClient.put<ReportResponse>(`/reports/${id}`, body);
}

export function remove(id: number): Promise<void> {
  return apiClient.delete<void>(`/reports/${id}`);
}
