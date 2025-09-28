export interface CardLocation {
  locationId: number;
  locationName: string;
  description: string | null;
  quantityReg: number;
  quantityFoil: number;
}

export interface CardLocationAssociation {
  userId: number;
  cardId: number;
  locationId: number;
  quantityReg: number;
  quantityFoil: number;
}

export interface AssociateCardLocationRequest {
  cardId: number;
  locationId: number;
  quantityReg?: number;
  quantityFoil?: number;
}

export interface UpdateCardLocationRequest {
  cardId: number;
  locationId: number;
  quantityReg: number;
  quantityFoil: number;
}

export interface RemoveCardLocationRequest {
  cardId: number;
  locationId: number;
}

export interface CardLocationsResponse {
  cardId: number;
  locations: CardLocation[];
}

export interface LocationCardsResponse {
  locationId: number;
  locationName: string;
  totalCards: number;
  totalValue: number;
  cards: LocationCard[];
}

export interface LocationCard {
  cardId: number;
  cardName: string;
  setId: number;
  setName: string;
  collectorNumber: string;
  rarity: string;
  quantityReg: number;
  quantityFoil: number;
  regularPrice: number;
  foilPrice: number;
  imageUrl: string;
}

export interface MassUpdateLocationRequest {
  mode: 'set' | 'increment' | 'remove';
  cardIds: number[];
  locationId?: number;
  quantityReg?: number;
  quantityFoil?: number;
}

export interface MassUpdateLocationResponse {
  processed: number;
  successful: number;
  failed: number;
  operations: {
    created: number;
    updated: number;
    removed: number;
  };
  errors?: Array<{
    cardId: number;
    reason: string;
  }>;
  warnings?: Array<{
    cardId: number;
    message: string;
  }>;
}