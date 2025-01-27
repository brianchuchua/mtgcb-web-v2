export interface BrowsePreferences {
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

export interface BrowseSearchParams {
  name?: string;
  oracleText?: string;
}

export interface BrowseState {
  searchParams: BrowseSearchParams;
}
