export interface CardTypes {
  cardTypes: string[];
  superTypes: string[];
  artifactTypes: string[];
  battleTypes: string[];
  enchantmentTypes: string[];
  landTypes: string[];
  planeswalkerTypes: string[];
  spellTypes: string[];
  creatureTypes: string[];
  planarTypes: string[];
}

export interface CardLayouts {
  layouts: string[];
}

/**
 * Card treatments, derived from the data rather than hardcoded — `borderColors`
 * and `frameStyles` from their columns' distinct values, `frameEffects` unnested
 * from the Postgres array literal it is stored as. Whatever the importer writes
 * is what the filter UI offers.
 *
 * `frameStyles` is Scryfall's base `frame` era ('1993', '1997', '2003', '2015',
 * 'future') — one per card, and distinct from `frameEffects`, of which a card
 * can carry several.
 */
export interface CardTreatments {
  borderColors: string[];
  /** Absent from API versions that predate the frame filter — always default it. */
  frameStyles?: string[];
  frameEffects: string[];
}
