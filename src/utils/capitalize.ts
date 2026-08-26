/**
 * Title-cases a label for display.
 *
 * Used for single-word values (card rarity, set category) and for set types,
 * which come in two shapes: lowercase underscore-separated tokens from Scryfall
 * ("draft_innovation") and values stored already spaced and capitalised
 * ("Secret Lair", "List"). Splitting on whitespace as well as underscores handles
 * both — the previous implementation lowercased the whole string and restored only
 * the first letter, rendering "Secret Lair" as "Secret lair" and leaving
 * "draft_innovation" as "Draft_innovation".
 *
 * Single-word input behaves exactly as before.
 *
 * Mirrors formatSetTypeTitle in mtgcb-api-v3, which produces the labels for the
 * set-type filter list.
 */
function capitalize(word: string | null): string | null {
  if (word == null) return word;

  return word
    .toLowerCase()
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default capitalize;
