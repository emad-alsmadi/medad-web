import type { CrimeTypeResponse } from '@/types/crime-type';
import type { FormTypeResponse } from '@/types/form-type';
import type { UserResponse } from '@/types/user';

/** نوع الضبط */
export type ReportType =
  | 'JUDICIAL'
  | 'ADMINISTRATIVE'
  | 'RESISTANCE'
  | 'CRIMINAL'
  | 'DETENTION_RELEASE';

/** إذاعة البحث */
export type SearchBroadcast = 'PRESENT' | 'ABSENT';

/** النتيجة — CLOSED (تم ختم الضبط) makes the report read-only for good. */
export type ReportResult = 'CLOSED' | 'UNDER_INVESTIGATION' | 'FURTHER_INVESTIGATION';

export interface EnumOption<T extends string> {
  value: T;
  /** Arabic label. */
  label: string;
}

/** GET /reports/options — the enum values with their Arabic labels. */
export interface ReportOptionsResponse {
  types: EnumOption<ReportType>[];
  searchBroadcasts: EnumOption<SearchBroadcast>[];
  results: EnumOption<ReportResult>[];
}

/** المدعي / المدعى عليه */
export interface Party {
  name: string | null;
  motherName: string | null;
  nationalId: string | null;
  origin: string | null;
  residence: string | null;
}

/** المصادرات — stored and displayed only. */
export interface Confiscation {
  weapons: string | null;
  vehicles: string | null;
  drugs: string | null;
  money: string | null;
  seizedItems: string | null;
  notes: string | null;
}

/**
 * Body of POST/PUT /reports. PUT replaces every field: anything omitted
 * becomes null/false (except reportDate), so always send the full object.
 */
export interface ReportRequest {
  reportNumber: string;
  type: ReportType;
  /** Must be a leaf form type (childrenCount === 0), otherwise 400. */
  formTypeId: number;
  result: ReportResult;
  /** 'YYYY-MM-DD' */
  reportDate: string;
  /** null (never 0) for a report with no crime; when set, crimePlace and crimeDate are required. */
  crimeTypeId: number | null;
  searchBroadcast: SearchBroadcast | null;
  prosecutionPermission: boolean;
  discovered: boolean;
  plaintiff: Party | null;
  defendant: Party | null;
  crimePlace: string | null;
  /** 'YYYY-MM-DD' */
  crimeDate: string | null;
  actionTaken: string | null;
  /** null (or all-empty) means no confiscations. */
  confiscation: Confiscation | null;
  /** On create, leaving all five text fields out fills them from the form type's template. */
  introduction?: string | null;
  body?: string | null;
  referral?: string | null;
  conclusion?: string | null;
  summary?: string | null;
}

export interface ReportResponse {
  id: number;
  reportNumber: string;
  reportDate: string;
  /** null only on reports created before the field existed. */
  type: ReportType | null;
  searchBroadcast: SearchBroadcast | null;
  prosecutionPermission: boolean;
  discovered: boolean;
  /** null only on reports created before the field existed. */
  result: ReportResult | null;
  plaintiff: Party | null;
  defendant: Party | null;
  crimeType: CrimeTypeResponse | null;
  crimePlace: string | null;
  crimeDate: string | null;
  actionTaken: string | null;
  confiscation: Confiscation | null;
  introduction: string | null;
  body: string | null;
  referral: string | null;
  conclusion: string | null;
  summary: string | null;
  formType: FormTypeResponse;
  creator: UserResponse;
  editor: UserResponse | null;
}

/** Filters shared by GET /reports and GET /reports/export. */
export interface ReportFilterParams {
  /**
   * Free text: every word must appear in the report number, either party's name or national
   * ID, the crime place or the summary.
   */
  search?: string;
  /** Exact form type only — sub-types are not included. */
  formTypeId?: number;
  type?: ReportType;
  crimeTypeId?: number;
  result?: ReportResult;
  creatorId?: number;
  /** 'YYYY-MM-DD', inclusive */
  from?: string;
  /** 'YYYY-MM-DD', inclusive */
  to?: string;
}

export interface ReportListParams extends ReportFilterParams {
  page?: number;
  size?: number;
  sort?: string;
}

/** A CLOSED (تم ختم الضبط) report can no longer be edited, deleted or have its result changed. */
export function isReportClosed(report: Pick<ReportResponse, 'result'>): boolean {
  return report.result === 'CLOSED';
}
