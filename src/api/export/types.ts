export interface ExportFormat {
  id: string;
  name: string;
  description: string;
  defaultFields: ExportField[];
  availableFields: ExportField[];
}

export interface ExportField {
  name: string;
  header: string;
}

export interface ExportFormatsResponse {
  success: boolean;
  data: ExportFormat[];
  error: null | {
    code: string;
    message: string;
    details?: string;
  };
}

export interface ExportCollectionParams {
  format?: string;
  fields?: string[];
  setId?: number;
  setCode?: string;
  rarity?: string[];
  colors?: string[];
  minQuantity?: number;
  includeZeroQuantity?: boolean;
}