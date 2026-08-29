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
 * from the column's distinct values, `frameEffects` unnested from the Postgres
 * array literal it is stored as. Whatever the importer writes is what the filter
 * UI offers.
 */
export interface CardTreatments {
  borderColors: string[];
  frameEffects: string[];
}
