export interface CardModel {
  id: string;
  name: string;
  scryfallId: string;
  setId: string;
  setName: string;
  setSlug: string;
  rarity: string;
  rarityNumeric: number;
  collectorNumber: string;
  mtgcbCollectorNumber: string | null;
  type: string;
  artist: string | null;
  manaCost: string | null;
  convertedManaCost: number | null;
  powerNumeric: string | null;
  toughnessNumeric: string | null;
  loyaltyNumeric: string | null;
  tcgplayerId: string | null;
  tcgplayerName?: string | null;
  tcgplayerSetCode?: string | null;
  flavorName?: string | null;
  market: string | null;
  low: string | null;
  average: string | null;
  high: string | null;
  foil: string | null;
  prices?: {
    normal: {
      market: number | null;
      low: number | null;
      average: number | null;
      high: number | null;
    } | null;
    foil: {
      market: number | null;
      low: number | null;
      average: number | null;
      high: number | null;
    } | null;
  };
  releaseDate: string | null;
  canBeFoil?: boolean;
  canBeNonFoil?: boolean;
  // Collection quantities (only present when userId is provided)
  quantityReg?: number;
  quantityFoil?: number;
  // Goal progress fields (only present when showGoalProgress is true)
  goalTargetQuantityReg?: number;
  goalTargetQuantityFoil?: number;
  goalTargetQuantityAll?: number | null;
  goalRegMet?: boolean;
  goalFoilMet?: boolean;
  goalAllMet?: boolean;
  goalFullyMet?: boolean;
  goalRegNeeded?: number;
  goalFoilNeeded?: number;
  goalAllNeeded?: number;
  // Cross-set goal tracking fields
  goalMetByOtherSets?: boolean;
  goalContributingSetIds?: string[];
  goalContributingVersions?: {
    cardId: string;
    setId: string;
    setName?: string;
    quantityReg: number;
    quantityFoil: number;
  }[];
  // Location fields (only present when includeLocations is true)
  locations?: {
    locationId: number;
    locationName: string;
    description: string | null;
    quantityReg: number;
    quantityFoil: number;
  }[];
}

export interface GoalSummary {
  goalId: number;
  goalName: string;
  totalCards: number;
  collectedCards: number;
  percentageCollected: number;
  totalValue: number;
  costToComplete: number;
}

export interface CardSearchData {
  cards: CardModel[];
  totalCount: number;
  limit: number;
  offset: number;
  // Collection summary fields (only present when userId is provided)
  username?: string;
  totalCardsCollected?: number;
  uniquePrintingsCollected?: number;
  numberOfCardsInMagic?: number;
  percentageCollected?: number;
  totalValue?: number;
  // Goal summary (present when goalId provided)
  goalSummary?: GoalSummary;
}

export interface CardApiParams {
  name?: string;
  oracleText?: string;
  artist?: string;
  colors_array?: {
    exactly?: string[];
    atLeast?: string[];
    atMost?: string[];
  };
  type?: {
    AND?: string[];
    NOT?: string[];
  };
  rarityNumeric?: {
    OR?: string[];
    AND?: string[];
  };
  setId?: {
    OR?: string[];
    AND?: string[];
  };
  setType?: string | string[] | {
    OR?: string[];
    NOT?: string[];
  };
  setCategory?: string | string[] | {
    OR?: string[];
    NOT?: string[];
  };
  [key: string]: any; // Allow for dynamic stat filters
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  oneResultPerCardName?: boolean;
  select?: string[];
  userId?: number;
  priceType?: 'market' | 'low' | 'average' | 'high';
  goalId?: number;
  showGoalProgress?: boolean;
  showGoals?: 'all' | 'complete' | 'incomplete';
  locationId?: number;
  includeChildLocations?: boolean;
  includeLocations?: boolean;
  includeBadDataOnly?: boolean;
}

export interface SetApiParams {
  name?: string;
  slug?: string;
  code?: string;
  setType?: string | string[] | {
    OR?: string[];
    NOT?: string[];
  };
  category?: string | string[] | {
    OR?: string[];
    NOT?: string[];
  };
  parentSetId?: string | null;
  releasedAt?: string;
  isDraftable?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  select?: string[];
  // Collection-specific parameters
  userId?: number;
  priceType?: 'market' | 'low' | 'average' | 'high';
  includeSubsetsInSets?: boolean;
  completionStatus?: {
    OR?: string[];
    NOT?: string[];
  };
  goalId?: number;
  showGoals?: 'all' | 'complete' | 'incomplete';
}
