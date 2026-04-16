/**
 * Text Editor Document Interface
 */
export interface TextDocument {
  id: string;
  title: string;
  content: string;
  clinicId: string;
  branchId?: string; // Optional for backward compatibility with individual clinics
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
  tags?: string[];
}

/**
 * Text Document Creation Interface
 */
export interface CreateTextDocumentRequest {
  title: string;
  content: string;
  clinicId: string;
  branchId?: string;
  createdBy: string;
  tags?: string[];
}

/**
 * Text Document Update Interface
 */
export interface UpdateTextDocumentRequest {
  title?: string;
  content?: string;
  lastModifiedBy: string;
  tags?: string[];
}
