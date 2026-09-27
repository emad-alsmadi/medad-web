/** نوع الجرم — a flat, ADMIN-managed list picked from by a report's crimeTypeId. */
export interface CrimeTypeResponse {
  id: number;
  name: string;
}

export interface CrimeTypeRequest {
  name: string;
}
