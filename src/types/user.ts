import type { Permissions, RoleSummary } from '@/types/role';

/**
 * Stored once per user (not per report). Appears nested inside a
 * report's `creator`/`editor`.
 */
export interface ReportInfo {
  governorate: string;
  district: string;
  subDistrict: string;
  department: string;
  policeStation: string;
}

export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  role: RoleSummary | null;
  enabled: boolean;
  reportInfo: ReportInfo | null;
  /** Only present on GET /users/me. */
  permissions?: Permissions;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  reportInfo?: ReportInfo;
}

export interface CreateUserRequest extends RegisterRequest {
  roleId: number;
}
