// Sentinel locationId for "owned cards that have not been placed in any location yet". Kept
// in sync with the backend constant in src/features/search/cards/utils/locationFilters.ts.
export const UNASSIGNED_LOCATION_ID = -1;

export function isUnassignedLocation(locationId: number | null | undefined): boolean {
  return locationId === UNASSIGNED_LOCATION_ID;
}

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