export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code?: string; // Not HTTP status code, e.g., "UNAUTHORIZED"
  details?: unknown;
}
