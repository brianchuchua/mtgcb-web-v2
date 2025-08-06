/**
 * Extracts the base card name from a name that might include flavor text or qualifiers
 * @param cardName - The full card name (might include flavor text in parentheses)
 * @returns The base card name without qualifiers
 * 
 * Examples:
 * - "Animate Wall (Retro Frame)" -> "Animate Wall"
 * - "Lightning Bolt" -> "Lightning Bolt"
 * - "Jace, the Mind Sculptor (Borderless)" -> "Jace, the Mind Sculptor"
 */
export function extractBaseName(cardName: string | undefined | null): string {
  if (!cardName) return '';
  
  // Remove anything in parentheses at the end of the name
  // This handles cases like "(Retro Frame)", "(Borderless)", "(Showcase)", etc.
  return cardName.replace(/\s*\([^)]*\)\s*$/g, '').trim();
}