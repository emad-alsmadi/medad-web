/**
 * Standardized paginated response shape. Every list endpoint's lib
 * function should resolve to this so hooks/components share one
 * pagination contract instead of reinventing it per feature.
 */
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
