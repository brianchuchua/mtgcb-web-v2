import { CostToComplete } from '@/api/collections/types';

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
  cardCountIncludingSubsets: string | null;
  iconUrl: string | null;
  sealedProductUrl: string | null;
  isDraftable: boolean;
  isSubsetGroup: boolean;
  subsetGroupId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  // Collection fields (when userId is provided)
  totalCardsCollectedInSet?: number;
  uniquePrintingsCollectedInSet?: number;
  percentageCollected?: number;
  totalValue?: number;
  costToComplete?: CostToComplete;
  // Collection fields including subsets (when userId is provided and includeSubsetsInSets is true)
  totalCardsCollectedInSetIncludingSubsets?: number;
  uniquePrintingsCollectedInSetIncludingSubsets?: number;
  percentageCollectedIncludingSubsets?: number;
  totalValueIncludingSubsets?: number;
}

export interface SetsSearchResult {
  totalCount: number;
  limit: number;
  offset: number;
  sets: Set[];
  // Collection summary fields (present when userId is provided)
  username?: string;
  totalCardsCollected?: number;
  uniquePrintingsCollected?: number;
  numberOfCardsInMagic?: number;
  percentageCollected?: number;
  totalValue?: number;
}
