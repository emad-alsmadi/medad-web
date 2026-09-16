import { apiClient } from '@/lib/api/client';
import type { ReportTemplateRequest, ReportTemplateResponse } from '@/types/report-template';

export function list(): Promise<ReportTemplateResponse[]> {
  return apiClient.get<ReportTemplateResponse[]>('/report-templates');
}

export function get(reportTypeId: number): Promise<ReportTemplateResponse> {
  return apiClient.get<ReportTemplateResponse>(`/report-types/${reportTypeId}/template`);
}

export function save(
  reportTypeId: number,
  body: ReportTemplateRequest,
): Promise<ReportTemplateResponse> {
  return apiClient.put<ReportTemplateResponse>(`/report-types/${reportTypeId}/template`, body);
}

export function remove(reportTypeId: number): Promise<void> {
  return apiClient.delete<void>(`/report-types/${reportTypeId}/template`);
}

export function getPdf(reportTypeId: number): Promise<Blob> {
  return apiClient.getBlob(`/report-types/${reportTypeId}/template/pdf`);
}
