export interface ImportFormat {
  id: string;
  name: string;
  description: string;
  requiredFields: ImportField[];
  supportedFields: ImportField[];
}

export interface ImportField {
  name: string;
  header: string;
}

export interface ImportFormatsResponse {
  success: boolean;
  data: ImportFormat[];
  error: null | {
    code: string;
    message: string;
    details?: string;
  };
}

export interface ImportCollectionParams {
  csvData: string;
  filename: string;
  fieldMappings?: Array<{
    csvHeader: string;
    mtgcbField: string;
  }>;
}

export interface ImportCollectionQuery {
  format?: string;
  dryRun?: boolean;
  updateMode?: 'replace' | 'merge';
}

export interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface ImportResult {
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  created: number;
  updated: number;
  deleted: number;
  partialSuccess: boolean;
  errors: ImportError[];
}

export interface ImportCollectionResponse {
  success: boolean;
  data: ImportResult | null;
  error: null | {
    code: string;
    message: string;
    details?: string;
  };
}

export interface PreviewCSVParams {
  csvData: string;
  rowLimit?: number;
}

export interface PreviewCSVResponse {
  success: boolean;
  data: {
    headers: string[];
    sampleRows: string[][];
    suggestedMappings: Record<string, {
      field: string;
      confidence: number;
    }>;
  };
  error: null | {
    code: string;
    message: string;
    details?: string;
  };
}