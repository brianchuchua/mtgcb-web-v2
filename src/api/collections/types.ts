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
    locationId?: number;
  }>;
}

export interface CollectionUpdateData {
  cards: Array<{
    cardId: number;
    quantityReg: number;
    quantityFoil: number;
    location?: {
      locationId: number;
      quantityReg: number;
      quantityFoil: number;
    } | null;
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

// History types
export type OperationType =
  | 'update'
  | 'mass-update'
  | 'mass-entry'
  | 'import'
  | 'nuke'
  | 'location-assign'
  | 'location-update'
  | 'location-remove'
  | 'location-mass-update';

export type OperationMode = 'set' | 'increment' | 'merge' | 'replace' | 'remove';

export interface CardInfo {
  id: number;
  name: string;
  setCode: string;
  setName: string;
}

export interface SetInfo {
  id: number;
  code: string;
  name: string;
  slug: string;
}

export interface LocationInfo {
  id: number;
  name: string;
}

export interface QuantityChange {
  regular: {
    before: number | null;
    after: number | null;
  };
  foil: {
    before: number | null;
    after: number | null;
  };
}

export interface BulkOperationData {
  cardsAffected: number;
  created?: number;
  updated?: number;
  deleted?: number;
  setCode?: string;
  setName?: string;
  setSlug?: string;
  rarity?: string;
  locationId?: number;
  locationName?: string;
  quantityReg?: number;
  quantityFoil?: number;
}

export interface HistoryEntry {
  id: number;
  timestamp: string;
  operationType: OperationType;
  mode: OperationMode | null;
  description: string;
  card: CardInfo | null;
  set: SetInfo | null;
  location: LocationInfo | null;
  quantities: QuantityChange | null;
  bulkSummary: BulkOperationData | null;
}

export interface CollectionHistoryData {
  history: HistoryEntry[];
}

export type CollectionHistoryResponse = ApiResponse<CollectionHistoryData>;