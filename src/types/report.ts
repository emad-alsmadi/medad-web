import type { ReportTypeResponse } from '@/types/report-type';
import type { UserResponse } from '@/types/user';

export interface ReportRequest {
  reportNumber: string;
  reportTypeId: number;
  /** 'YYYY-MM-DD'. Defaults to today on create; keeps the old value on update if omitted. */
  reportDate?: string;
  introduction?: string;
  body?: string;
  referral?: string;
  conclusion?: string;
  summary?: string;
}

export interface ReportResponse {
  id: number;
  reportNumber: string;
  reportDate: string;
  introduction: string | null;
  body: string | null;
  referral: string | null;
  conclusion: string | null;
  summary: string | null;
  reportType: ReportTypeResponse;
  creator: UserResponse;
  editor: UserResponse | null;
}

export interface ReportListParams {
  page?: number;
  size?: number;
  sort?: string;
  typeId?: number;
  creatorId?: string;
  /** 'YYYY-MM-DD', inclusive */
  from?: string;
  /** 'YYYY-MM-DD', inclusive */
  to?: string;
}
