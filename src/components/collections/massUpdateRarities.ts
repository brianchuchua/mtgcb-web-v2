export type MassUpdateRarity =
  | 'common'
  | 'commonNoBasicLand'
  | 'uncommon'
  | 'rare'
  | 'mythic'
  | 'special'
  | 'basicLand'
  | 'all';

// Dropdown order and wording. Scryfall files basic lands as common, so commons come in two flavors.
export const MASS_UPDATE_RARITY_OPTIONS: Array<{ value: MassUpdateRarity; menuLabel: string; label: string }> = [
  { value: 'all', menuLabel: 'All cards', label: 'cards' },
  { value: 'common', menuLabel: 'All commons (w/basic lands)', label: 'commons (including basic lands)' },
  { value: 'commonNoBasicLand', menuLabel: 'All commons (w/o basic lands)', label: 'commons (excluding basic lands)' },
  { value: 'uncommon', menuLabel: 'All uncommons', label: 'uncommons' },
  { value: 'rare', menuLabel: 'All rares', label: 'rares' },
  { value: 'mythic', menuLabel: 'All mythics', label: 'mythics' },
  { value: 'special', menuLabel: 'All special cards', label: 'special cards' },
  { value: 'basicLand', menuLabel: 'All basic lands', label: 'basic lands' },
];

export const getMassUpdateRarityLabel = (rarity: string): string =>
  MASS_UPDATE_RARITY_OPTIONS.find((option) => option.value === rarity)?.label ?? rarity;
