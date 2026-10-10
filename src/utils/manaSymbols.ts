/**
 * Maps Scryfall's curly-brace symbols ({T}, {W/U}, {B/G/P}, {HW}, {½} ...) to mana-font
 * (https://mana.andrewgioia.com) classes. Covers every symbol in Scryfall's /symbology list.
 */

const COLOR_NAMES: Record<string, string> = {
  w: 'White',
  u: 'Blue',
  b: 'Black',
  r: 'Red',
  g: 'Green',
  c: 'Colorless',
};

// Symbols whose mana-font class isn't just the lowercased symbol
const SPECIAL_CLASSES: Record<string, string[]> = {
  t: ['ms-tap'],
  q: ['ms-untap'],
  p: ['ms-paw'], // Bloomburrow pawprint, not Phyrexian
  pw: ['ms-planeswalker'],
  a: ['ms-acorn'],
  tk: ['ms-ticket'],
  chaos: ['ms-chaos'],
  '∞': ['ms-infinity'],
  '½': ['ms-1-2'],
  'c/p': ['ms-h'], // mana-font has no colorless Phyrexian glyph
};

const SPECIAL_NAMES: Record<string, string> = {
  t: 'Tap',
  q: 'Untap',
  e: 'Energy',
  p: 'Paw',
  pw: 'Planeswalker',
  a: 'Acorn',
  tk: 'Ticket',
  chaos: 'Chaos',
  s: 'Snow Mana',
  x: 'X',
  y: 'Y',
  z: 'Z',
  h: 'Phyrexian Mana',
  l: 'Legendary Mana',
  d: 'Land Drop',
  '∞': 'Infinite Mana',
  '½': 'Half Generic Mana',
  'c/p': 'Phyrexian Colorless Mana',
};

const SIMPLE_SYMBOL = /^(\d+|[wubrgcsxyzehld])$/;
const HALF_SYMBOL = /^h([wubrg])$/;
const HYBRID_SYMBOL = /^([wubrg2c])\/([wubrg])$/;
const PHYREXIAN_SYMBOL = /^(?:([wubrg])\/)?([wubrg])\/p$/;

/** mana-font classes for a symbol (without braces), or null if mana-font can't draw it. */
export const getManaSymbolClasses = (symbol: string): string[] | null => {
  const s = symbol.toLowerCase();
  if (SPECIAL_CLASSES[s]) return SPECIAL_CLASSES[s];
  if (SIMPLE_SYMBOL.test(s)) return [`ms-${s}`];

  const half = HALF_SYMBOL.exec(s);
  if (half) return [`ms-${half[1]}`, 'ms-half'];

  const phyrexian = PHYREXIAN_SYMBOL.exec(s);
  if (phyrexian) return [`ms-${phyrexian[1] ?? ''}${phyrexian[2]}p`];

  const hybrid = HYBRID_SYMBOL.exec(s);
  if (hybrid) return [`ms-${hybrid[1]}${hybrid[2]}`];

  return null;
};

/** Human-readable name for a symbol (without braces), used as the icon's aria-label. */
export const getManaSymbolName = (symbol: string): string => {
  const s = symbol.toLowerCase();
  if (SPECIAL_NAMES[s]) return SPECIAL_NAMES[s];
  if (COLOR_NAMES[s]) return `${COLOR_NAMES[s]} Mana`;
  if (/^\d+$/.test(s)) return `${s} Generic Mana`;

  const half = HALF_SYMBOL.exec(s);
  if (half) return `Half ${COLOR_NAMES[half[1]]} Mana`;

  const phyrexian = PHYREXIAN_SYMBOL.exec(s);
  if (phyrexian) {
    const colors = [phyrexian[1], phyrexian[2]].filter(Boolean).map((c) => COLOR_NAMES[c!]);
    return `Phyrexian ${colors.join('/')} Mana`;
  }

  const hybrid = HYBRID_SYMBOL.exec(s);
  if (hybrid) {
    const first = hybrid[1] === '2' ? 'Two Generic' : COLOR_NAMES[hybrid[1]];
    return `Hybrid ${first}/${COLOR_NAMES[hybrid[2]]} Mana`;
  }

  return symbol;
};

export type SymbolTextPart = { type: 'text'; text: string } | { type: 'symbol'; symbol: string; classes: string[] };

/**
 * Splits text into plain-text and symbol parts. Braces mana-font can't draw stay as text,
 * so an unknown symbol shows as "{FOO}" rather than an empty icon.
 */
export const parseSymbolText = (text: string): SymbolTextPart[] => {
  const parts: SymbolTextPart[] = [];
  const symbolRegex = /\{([^{}]+)\}/g;
  let lastIndex = 0;
  let pending = '';
  let match;

  while ((match = symbolRegex.exec(text)) !== null) {
    const classes = getManaSymbolClasses(match[1]);
    pending += text.substring(lastIndex, match.index);
    lastIndex = match.index + match[0].length;

    if (!classes) {
      pending += match[0];
      continue;
    }
    if (pending) parts.push({ type: 'text', text: pending });
    pending = '';
    parts.push({ type: 'symbol', symbol: match[1], classes });
  }

  pending += text.substring(lastIndex);
  if (pending) parts.push({ type: 'text', text: pending });
  return parts;
};
