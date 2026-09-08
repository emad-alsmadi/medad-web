/**
 * Spring `Page<T>` shape returned by every paginated backend endpoint.
 * Only the fields the UI actually needs are typed strictly; `sort`/
 * `pageable` are kept loose since nothing renders them directly.
 */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  sort: unknown;
  pageable: unknown;
}

export interface PageParams {
  page?: number;
  size?: number;
  sort?: string | string[];
}

/**
 * JSON body shape of every backend error response except a missing
 * Authorization header (which returns an empty 403 body). Carried in
 * `ApiError.details` (see lib/api/client.ts) when parseable.
 */
export interface ApiErrorBody {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
  fieldErrors?: Record<string, string>;
}
