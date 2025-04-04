export interface Set {
  id: string;
  name: string;
  slug: string;
  code: string | null;
  scryfallId: string | null;
  tcgplayerId: string | null;
  setType: string | null;
  category: string | null;
  releasedAt: string | null;
  blockId: string | null;
  parentSetId: string | null;
  cardCount: string | null;
  iconUrl: string | null;
  sealedProductUrl: string | null;
  isDraftable: boolean;
  isSubsetGroup: boolean;
  subsetGroupId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SetsSearchResult {
  totalCount: number;
  limit: number;
  offset: number;
  sets: Set[];
}
