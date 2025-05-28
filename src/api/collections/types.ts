import { ApiResponse } from '@/api/types/apiTypes';

export interface CollectionSummaryParams {
  userId: number;
  priceType: 'market' | 'low' | 'average' | 'high';
  includeSubsetsInSets: boolean;
}

export interface CostToComplete {
  oneOfEachCard: number;
  oneOfEachMythic: number;
  oneOfEachRare: number;
  oneOfEachUncommon: number;
  oneOfEachCommon: number;
  fourOfEachCard: number;
  fourOfEachMythic: number;
  fourOfEachRare: number;
  fourOfEachUncommon: number;
  fourOfEachCommon: number;
  draftCube: number;
  totalValue: number;
}

export interface CollectionSetSummary {
  id: string;
  setId: string;
  name: string;
  slug: string;
  code: string;
  setType: string;
  cardCount: number;
  category: string;
  releasedAt: string;
  sealedProductUrl: string;
  isDraftable: boolean;
  subsetGroupId: string | null;
  isSubsetGroup: boolean;
  parentSetId: string | null;
  totalCardsCollectedInSet: number;
  uniquePrintingsCollectedInSet: number;
  cardCountIncludingSubsets: number;
  percentageCollected: number;
  costToComplete: CostToComplete;
}

export interface CollectionSummary {
  userId: number;
  username: string;
  totalCardsCollected: number;
  uniquePrintingsCollected: number;
  numberOfCardsInMagic: number;
  percentageCollected: number;
  totalValue: number;
  sets: CollectionSetSummary[];
}

export type CollectionSummaryResponse = ApiResponse<CollectionSummary>;

export interface CollectionCardsParams {
  userId: number;
  setId: number;
  includeSubsetsInSets: boolean;
}

export interface CollectionCard {
  cardId: number;
  quantityReg: number;
  quantityFoil: number;
}

export interface CollectionCardsData {
  userId: number;
  username: string;
  setId: number;
  setName: string;
  cards: CollectionCard[];
}

export type CollectionCardsResponse = ApiResponse<CollectionCardsData>;

export interface CollectionUpdateRequest {
  mode: 'set' | 'increment';
  cards: Array<{
    cardId: number;
    quantityReg: number;
    quantityFoil: number;
  }>;
}

export interface CollectionUpdateData {
  cards: Array<{
    cardId: number;
    quantityReg: number;
    quantityFoil: number;
  }>;
}

export type CollectionUpdateResponse = ApiResponse<CollectionUpdateData>;