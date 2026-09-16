export interface ReportTemplateRequest {
  creator?: string;
  writer?: string;
  copyLabel?: string;
  introduction?: string;
  body?: string;
  referral?: string;
  conclusion?: string;
  summary?: string;
}

export interface ReportTemplateResponse extends ReportTemplateRequest {
  id: number;
  reportTypeId: number;
}
