/**
 * Format legality options for card filtering and card detail display.
 *
 * `value` is the raw Scryfall key sent to the API (lowercase, no transformation).
 * `label` is the display name shown to users.
 * `digital: true` flags Arena/MTGO-only formats so the UI can mark them visually.
 *
 * When Scryfall adds or removes a format, update this one file.
 */

export interface FormatLegalityOption {
  value: string;
  label: string;
  digital?: boolean;
}

export const FORMAT_LEGALITY_OPTIONS: FormatLegalityOption[] = [
  // Paper-first formats
  { value: 'standard', label: 'Standard' },
  { value: 'pioneer', label: 'Pioneer' },
  { value: 'modern', label: 'Modern' },
  { value: 'legacy', label: 'Legacy' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'pauper', label: 'Pauper' },
  { value: 'commander', label: 'Commander' },
  { value: 'oathbreaker', label: 'Oathbreaker' },
  { value: 'paupercommander', label: 'Pauper Commander' },
  { value: 'brawl', label: 'Brawl' },
  { value: 'duel', label: 'Duel Commander' },
  { value: 'premodern', label: 'Premodern' },
  { value: 'oldschool', label: 'Old School' },
  { value: 'predh', label: 'PreDH' },
  { value: 'penny', label: 'Penny Dreadful' },
  { value: 'future', label: 'Future Standard' },

  // Digital-only (Arena / MTGO)
  { value: 'alchemy', label: 'Alchemy', digital: true },
  { value: 'historic', label: 'Historic', digital: true },
  { value: 'timeless', label: 'Timeless', digital: true },
  { value: 'explorer', label: 'Explorer', digital: true },
  { value: 'gladiator', label: 'Gladiator', digital: true },
  { value: 'standardbrawl', label: 'Standard Brawl', digital: true },
];

/** Quick lookup: value → option. */
export const FORMAT_LEGALITY_BY_VALUE: Record<string, FormatLegalityOption> = FORMAT_LEGALITY_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option;
    return acc;
  },
  {} as Record<string, FormatLegalityOption>,
);

/** Returns the display label for a format key, falling back to the raw key if unknown. */
export function getFormatLabel(value: string): string {
  return FORMAT_LEGALITY_BY_VALUE[value]?.label ?? value;
}

/** Returns true if the given format is digital-only (Arena/MTGO). */
export function isDigitalFormat(value: string): boolean {
  return FORMAT_LEGALITY_BY_VALUE[value]?.digital === true;
}
