import { apiClient } from '@/lib/api/client';
import type { Page } from '@/types/api';
import type {
  ReportFilterParams,
  ReportListParams,
  ReportOptionsResponse,
  ReportRequest,
  ReportResponse,
  ReportResult,
} from '@/types/report';
import type { ReportStatisticsResponse, StatisticsRange } from '@/types/report-statistics';

const DEFAULT_SORT = 'reportDate,desc';

function appendFilters(search: URLSearchParams, params: ReportFilterParams): URLSearchParams {
  if (params.search?.trim()) search.set('search', params.search.trim());
  if (params.formTypeId !== undefined) search.set('formTypeId', String(params.formTypeId));
  if (params.type) search.set('type', params.type);
  if (params.crimeTypeId !== undefined) search.set('crimeTypeId', String(params.crimeTypeId));
  if (params.result) search.set('result', params.result);
  if (params.creatorId !== undefined) search.set('creatorId', String(params.creatorId));
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  return search;
}

export function list(params: ReportListParams = {}): Promise<Page<ReportResponse>> {
  const search = new URLSearchParams();
  search.set('page', String(params.page ?? 0));
  search.set('size', String(params.size ?? 20));
  search.set('sort', params.sort ?? DEFAULT_SORT);
  appendFilters(search, params);

  return apiClient.get<Page<ReportResponse>>(`/reports?${search.toString()}`);
}

export function options(): Promise<ReportOptionsResponse> {
  return apiClient.get<ReportOptionsResponse>('/reports/options');
}

export function statistics(range: StatisticsRange = {}): Promise<ReportStatisticsResponse> {
  const search = new URLSearchParams();
  if (range.from) search.set('from', range.from);
  if (range.to) search.set('to', range.to);
  const query = search.toString();
  return apiClient.get<ReportStatisticsResponse>(
    `/reports/statistics${query ? `?${query}` : ''}`,
  );
}

/** سجل الضبوط as .xlsx — same filters as the list, without paging/sorting. */
export function exportExcel(params: ReportFilterParams = {}): Promise<Blob> {
  const query = appendFilters(new URLSearchParams(), params).toString();
  return apiClient.getBlob(`/reports/export${query ? `?${query}` : ''}`);
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

/** Changes only the result; 409 once the report is CLOSED. */
export function changeResult(id: number, result: ReportResult): Promise<ReportResponse> {
  return apiClient.patch<ReportResponse>(`/reports/${id}/result`, { result });
}

export function remove(id: number): Promise<void> {
  return apiClient.delete<void>(`/reports/${id}`);
}

/** `copy` is the copy number printed in the header (1 → "النسخة الأولى"). */
export function getPdf(id: number, copy?: number): Promise<Blob> {
  return apiClient.getBlob(`/reports/${id}/pdf${copy ? `?copy=${copy}` : ''}`);
}
