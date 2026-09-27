import { apiClient } from '@/lib/api/client';
import type { ReportTemplateRequest, ReportTemplateResponse } from '@/types/report-template';

export function list(): Promise<ReportTemplateResponse[]> {
  return apiClient.get<ReportTemplateResponse[]>('/report-templates');
}

export function get(formTypeId: number): Promise<ReportTemplateResponse> {
  return apiClient.get<ReportTemplateResponse>(`/form-types/${formTypeId}/template`);
}

export function save(
  formTypeId: number,
  body: ReportTemplateRequest,
): Promise<ReportTemplateResponse> {
  return apiClient.put<ReportTemplateResponse>(`/form-types/${formTypeId}/template`, body);
}

export function remove(formTypeId: number): Promise<void> {
  return apiClient.delete<void>(`/form-types/${formTypeId}/template`);
}

export function getPdf(formTypeId: number): Promise<Blob> {
  return apiClient.getBlob(`/form-types/${formTypeId}/template/pdf`);
}
