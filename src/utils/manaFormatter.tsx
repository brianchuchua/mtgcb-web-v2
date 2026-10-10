'use client';

import React from 'react';
import { getManaSymbolName, parseSymbolText } from '@/utils/manaSymbols';

/**
 * Renders text containing Scryfall symbols ({W}, {T}, {2/U} ...) with mana-font icons.
 * `variant` picks the spacing: 'cost' for a mana cost line, 'inline' for rules text.
 */
export const formatSymbolText = (
  text: string | null | undefined,
  variant: 'cost' | 'inline' = 'inline',
): React.ReactNode => {
  if (!text) return null;

  return parseSymbolText(text).map((part, index) => {
    if (part.type === 'text') return <React.Fragment key={index}>{part.text}</React.Fragment>;
    return (
      <i
        key={index}
        className={`ms ${part.classes.join(' ')} ms-cost`}
        role="img"
        aria-label={getManaSymbolName(part.symbol)}
        title={`{${part.symbol}}`}
        style={variant === 'cost' ? { margin: '0 0.125rem' } : { margin: '0 0.1em', fontSize: '0.9em' }}
      />
    );
  });
};

/**
 * Parses a Magic: The Gathering mana cost string and returns
 * a formatted React element with mana symbols
 *
 * @param manaCost - The mana cost string (e.g. "{W}{U}{2}")
 * @returns JSX Element with styled mana symbols
 */
export const formatManaCost = (manaCost: string | null | undefined): React.ReactNode => {
  if (!manaCost) return null;
  return <span className="mana-cost">{formatSymbolText(manaCost, 'cost')}</span>;
};
