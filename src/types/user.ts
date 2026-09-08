import type { UserRole } from '@/types/auth';

/**
 * Stored once per user (not per report). Appears nested inside a
 * report's `creator`/`editor` — kept top-level (not under types/admin)
 * since /users is readable by both roles and reused by types/report.ts.
 */
export interface ReportInfo {
  governorate: string;
  district: string;
  subDistrict: string;
  department: string;
  policeStation: string;
}

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  enabled: boolean;
  reportInfo: ReportInfo | null;
}
