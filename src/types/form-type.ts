/**
 * نوع نموذج الضبط — the tree formerly called "report type" (/report-types).
 * Not to be confused with `ReportType` in types/report.ts, which is the
 * fixed نوع الضبط enum on the report itself.
 *
 * Flat/single shape returned by GET /form-types, /form-types/roots,
 * /form-types/{id} and /form-types/{id}/children. Only /tree nests
 * (FormTypeTreeNode below), so the two shapes are kept separate.
 */
export interface FormTypeResponse {
  id: number;
  name: string;
  witnessNumber: number;
  /** Absent on roots. */
  parentId?: number;
  /** > 0 means a category (root) that cannot be picked as a report's formTypeId. */
  childrenCount?: number;
}

export interface FormTypeTreeNode extends FormTypeResponse {
  children: FormTypeTreeNode[];
}

export interface FormTypeRequest {
  name: string;
  witnessNumber: number;
  /**
   * Omitting this on PUT converts the type to a root — always send the
   * current/chosen parentId explicitly (null to clear it) when editing.
   */
  parentId?: number | null;
}

/** A form type a report can be created on: one with no sub-types. */
export function isSelectableFormType(type: FormTypeResponse): boolean {
  return (type.childrenCount ?? 0) === 0;
}
