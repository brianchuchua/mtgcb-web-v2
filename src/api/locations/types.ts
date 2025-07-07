export interface Location {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocationWithCount extends Location {
  totalCards: number;
}

export interface CreateLocationRequest {
  name: string;
  description?: string;
}

export interface UpdateLocationRequest {
  name?: string;
  description?: string;
}

export interface DeleteLocationResponse {
  success: true;
}

export interface LocationsResponse {
  locations: LocationWithCount[];
  totalCount: number;
  limit: number;
  offset: number;
}