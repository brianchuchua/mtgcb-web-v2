export interface CardModel {
  id: string;
  name: string;
  localizedName: string | null;
  setId: string | null;
  subsetId: string | null;
  collectorNumber: string | null;
  mtgcbCollectorNumber: string | null;
  rarity: string | null;
  rarityNumeric: number | null;
  type: string | null;
  localizedTypeLine: string | null;
  manaCost: string | null;
  convertedManaCost: string | null;
  colors: string[];
  colors_array: string[];
  colorIdentities: string[];
  color_identities_array: string[];
  colorIndicatorColors: string[];
  color_indicator_colors_array: string[];
  oracleText: string | null;
  localizedText: string | null;
  flavorText: string | null;
  flavorName: string | null;
  power: string | null;
  powerNumeric: string | null;
  toughness: string | null;
  toughnessNumeric: string | null;
  loyalty: string | null;
  loyaltyNumeric: string | null;
  layout: string | null;
  borderColor: string | null;
  frameStyle: string | null;
  frameEffects: string[];
  watermark: string | null;
  isFullArt: boolean;
  isStorySpotlight: boolean;
  canBeFoil: boolean;
  canBeNonFoil: boolean;
  multiverseId: string | null;
  scryfallId: string | null;
  tcgplayerId: string | null;
  low: string | null;
  average: string | null;
  high: string | null;
  market: string | null;
  foil: string | null;
  tcgplayerSetCode: string | null;
  tcgplayerName: string | null;
  oracleId: string | null;
  rulingIds: string | null;
  imageUrl: string | null;
  releasedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CardSearchRequest {
  name?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface CardSearchData {
  cards: CardModel[];
  totalCount: number;
  limit: number;
  offset: number;
}