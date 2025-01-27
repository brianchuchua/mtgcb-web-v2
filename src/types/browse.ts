export interface BrowsePreferences {
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

export interface BrowseSearchParams {
  name?: string;
}

export interface BrowseState {
  searchParams: BrowseSearchParams;
}
