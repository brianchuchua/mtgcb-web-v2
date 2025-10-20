import { ApiResponse } from '@/api/types/apiTypes';

// Removed unused types: CollectionSummaryParams, CollectionSummary, CollectionSummaryResponse,
// CollectionCardsParams, CollectionCardsResponse, CollectionCardsData
// These were for deprecated endpoints that have been moved to the browse API

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
  goal?: number;
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

export interface CollectionUpdateRequest {
  mode: 'set' | 'increment';
  cards: Array<{
    cardId: number;
    quantityReg?: number;
    quantityFoil?: number;
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

export interface CollectionMassUpdateRequest {
  mode: 'set' | 'increment';
  setId: number;
  updates: Array<{
    rarity: 'common' | 'uncommon' | 'rare' | 'mythic' | 'all';
    quantityReg: number;
    quantityFoil: number;
  }>;
}

export interface CollectionMassUpdateData {
  setId: number;
  setCode: string;
  setName: string;
  updatedCards: number;
  updates: Array<{
    rarity: string;
    cardsUpdated: number;
    quantityReg: number;
    quantityFoil: number;
    skippedDueToConstraints?: {
      cannotBeFoil: number;
      cannotBeNonFoil: number;
    };
  }>;
  totalSkipped?: {
    cannotBeFoil: number;
    cannotBeNonFoil: number;
  };
}

export type CollectionMassUpdateResponse = ApiResponse<CollectionMassUpdateData>;

export interface CollectionMassEntryRequest {
  mode: 'set' | 'increment';
  cardIds: number[];
  updates: Array<{
    rarity: 'common' | 'uncommon' | 'rare' | 'mythic' | 'all';
    quantityReg: number;
    quantityFoil: number;
  }>;
}

export interface CollectionMassEntryData {
  totalCardsProvided: number;
  updatedCards: number;
  updates: Array<{
    rarity: string;
    cardsMatched: number;
    cardsUpdated: number;
    quantityReg: number;
    quantityFoil: number;
    skippedDueToConstraints?: {
      cannotBeFoil: number;
      cannotBeNonFoil: number;
    };
  }>;
  totalSkipped?: {
    cannotBeFoil: number;
    cannotBeNonFoil: number;
  };
}

export type CollectionMassEntryResponse = ApiResponse<CollectionMassEntryData>;