export interface Location {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocationWithCount extends Location {
  totalCards: number;
  totalValue?: number;
}

export interface LocationHierarchy extends Location {
  children: LocationHierarchy[];
}

export interface CreateLocationRequest {
  name: string;
  description?: string;
  parentId?: number;
}

export interface UpdateLocationRequest {
  name?: string;
  description?: string;
  parentId?: number | null;
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