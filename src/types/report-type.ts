/**
 * Flat/single shape returned by GET /report-types, GET /report-types/{id}
 * and GET /report-types/{id}/children. Deliberately has no `children`
 * field — the flat list never nests, only /tree does (ReportTypeTreeNode
 * below), so the two shapes are kept as separate types rather than one
 * optional field.
 */
export interface ReportTypeResponse {
  id: number;
  name: string;
  witnessNumber: number;
  parentId?: number;
}

export interface ReportTypeTreeNode extends ReportTypeResponse {
  children: ReportTypeTreeNode[];
}

export interface ReportTypeRequest {
  name: string;
  witnessNumber: number;
  /**
   * Omitting this on PUT converts the type to a root — always send the
   * current/chosen parentId explicitly (null to clear it) when editing.
   */
  parentId?: number | null;
}
