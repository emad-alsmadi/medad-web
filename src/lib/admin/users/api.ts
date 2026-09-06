import { apiClient } from '@/lib/api/client';
import type { PaginatedResponse, PaginationParams } from '@/types/api';
import type { AdminUserListItem } from '@/types/admin/user';

/**
 * Pure API function — no react-query, no caching logic. hooks/admin/users
 * wraps this with useQuery. Never import this directly from a component.
 */
export function fetchAdminUsers(
  params: PaginationParams = {},
): Promise<PaginatedResponse<AdminUserListItem>> {
  const { page = 1, pageSize = 20 } = params;
  const search = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return apiClient.get<PaginatedResponse<AdminUserListItem>>(`/admin/users?${search.toString()}`);
}
