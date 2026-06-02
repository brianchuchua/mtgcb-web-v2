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
  | 'location-mass-update'
  | 'migration';

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

export type MigrationResolution = 'auto' | 'ambiguous' | 'no_target';

export interface MigrationCandidate {
  cardId: number;
  name: string;
  setName: string | null;
  setSlug: string | null;
  setCode: string | null;
  collectorNumber: string | null;
  /** Scryfall id of the candidate's back face, when it's a custom combined token. Drives
   *  the migrate page's two-face hover preview (front + {cardId}b.jpg). NULL for
   *  single-face candidates. */
  backScryfallId: string | null;
  /** Finish capabilities of this candidate target. Used by the migrate UI to gate which
   *  QuantitySelector (Regular / Foil) renders per candidate, so a foil-only target
   *  doesn't surface a Regular selector just because the source has regulars. */
  canBeFoil: boolean;
  canBeNonFoil: boolean;
}

export interface DeprecatedHolding {
  sourceCardId: number;
  sourceName: string;
  /** Finish capabilities of the deprecated source card. Used by the migrate UI to suppress
   *  meaningless "/ 0 foil" or "/ 0 reg" counters when the card can't have that finish AND
   *  the user owns zero of it. */
  canBeFoil: boolean;
  canBeNonFoil: boolean;
  sourceSetName: string | null;
  sourceSetSlug: string | null;
  sourceSetCode: string | null;
  sourceCollectorNumber: string | null;
  quantityReg: number;
  quantityFoil: number;
  deprecatedReason: string | null;
  resolution: MigrationResolution;
  successorCardId: number | null;
  successorName: string | null;
  successorSetName: string | null;
  successorSetSlug: string | null;
  successorSetCode: string | null;
  successorCollectorNumber: string | null;
  /** Auto-resolved successor's back scryfall id, mirroring MigrationCandidate.backScryfallId. */
  successorBackScryfallId: string | null;
  /** Auto-resolved successor's finish capabilities — gates the selector(s) shown on the
   *  single synthesized candidate for auto rows. */
  successorCanBeFoil: boolean | null;
  successorCanBeNonFoil: boolean | null;
  ambiguousCandidates: MigrationCandidate[];
}

export interface DeprecatedHoldingsData {
  holdings: DeprecatedHolding[];
  totalCards: number;
  totalCopies: number;
  /** The set the holdings were scoped to (from setId, or resolved from a cardId deep-link).
   *  Null when the call returned every set. Lets the migrate page sync its set picker. */
  setId: number | null;
}

export type DeprecatedHoldingsResponse = ApiResponse<DeprecatedHoldingsData>;

export interface DeprecatedCardCountData {
  totalCards: number;
  totalCopies: number;
}

export type DeprecatedCardCountResponse = ApiResponse<DeprecatedCardCountData>;

export interface DeprecatedHoldingSet {
  setId: number;
  setCode: string | null;
  setName: string | null;
  totalCards: number;
  totalCopies: number;
}

export type DeprecatedHoldingSetsResponse = ApiResponse<{ sets: DeprecatedHoldingSet[] }>;

export type MigrationStatus =
  | 'migrated'
  | 'skipped_not_deprecated'
  | 'skipped_not_owned'
  | 'skipped_no_successor'
  | 'skipped_successor_deprecated'
  | 'skipped_invalid_target'
  | 'skipped_invalid_quantity'
  | 'error';

export interface MigrationRequestItem {
  cardId: number;
  /** Optional explicit successor (used to resolve ambiguous holdings where the user picks one). */
  targetCardId?: number;
  /** Reg copies to move to this target. Together with quantityFoil, enables splitting one
   *  deprecated source across multiple targets. Omitting BOTH = "move all". */
  quantityReg?: number;
  quantityFoil?: number;
}

export interface MigrationResult {
  sourceCardId: number;
  status: MigrationStatus;
  successorCardId: number | null;
  movedQuantityReg: number;
  movedQuantityFoil: number;
  movedLocations: number;
  message?: string;
}

export interface RunMigrationsData {
  results: MigrationResult[];
  migratedCount: number;
  skippedCount: number;
  errorCount: number;
}

export type RunMigrationsResponse = ApiResponse<RunMigrationsData>;