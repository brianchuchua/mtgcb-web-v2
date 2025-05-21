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
}

export interface CardSearchData {
  cards: CardModel[];
  totalCount: number;
  limit: number;
  offset: number;
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
  [key: string]: any; // Allow for dynamic stat filters
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  oneResultPerCardName?: boolean;
  select?: string[];
}

export interface SetApiParams {
  name?: string;
  slug?: string;
  code?: string;
  setType?:
    | string
    | {
        OR?: string[];
        NOT?: string[];
      };
  category?:
    | string
    | {
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
}
