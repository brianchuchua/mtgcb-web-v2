'use client';

import React from 'react';

/**
 * Parses a Magic: The Gathering mana cost string and returns
 * a formatted React element with mana symbols
 *
 * @param manaCost - The mana cost string (e.g. "{W}{U}{2}")
 * @returns JSX Element with styled mana symbols
 */
export const formatManaCost = (manaCost: string | null | undefined): React.ReactNode => {
  if (!manaCost) return null;

  // Regular expression to match mana symbols in the format {X}
  const symbolRegex = /\{([^}]+)\}/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  const matches: Array<{ symbol: string; startIndex: number; fullMatch: string }> = [];

  // Collect all matches first
  while ((match = symbolRegex.exec(manaCost)) !== null) {
    matches.push({
      symbol: match[1],
      startIndex: match.index,
      fullMatch: match[0],
    });
  }

  // Process matches
  matches.forEach((matchData, index) => {
    const { symbol, startIndex, fullMatch } = matchData;
    const isLastSymbol = index === matches.length - 1;

    // Add any text before the current symbol
    if (startIndex > lastIndex) {
      parts.push(manaCost.substring(lastIndex, startIndex));
    }

    // Add the symbol with the appropriate class
    // The 'ms' class is for the mana symbols from mana font
    parts.push(
      <i
        key={`${symbol}-${startIndex}`}
        className={`ms ms-${symbol.toLowerCase()} ms-cost`}
        aria-label={getSymbolName(symbol)}
        style={{ marginRight: isLastSymbol ? 0 : '0.25rem' }}
      />,
    );

    lastIndex = startIndex + fullMatch.length;
  });

  // Add any remaining text
  if (lastIndex < manaCost.length) {
    parts.push(manaCost.substring(lastIndex));
  }

  return <span className="mana-cost">{parts}</span>;
};

/**
 * Gets a human-readable name for a mana symbol
 */
function getSymbolName(symbol: string): string {
  switch (symbol.toLowerCase()) {
    case 'w':
      return 'White Mana';
    case 'u':
      return 'Blue Mana';
    case 'b':
      return 'Black Mana';
    case 'r':
      return 'Red Mana';
    case 'g':
      return 'Green Mana';
    case 'c':
      return 'Colorless Mana';
    case 'x':
      return 'X Mana';
    case 't':
      return 'Tap Symbol';
    case 'q':
      return 'Untap Symbol';
    case 's':
      return 'Snow Mana';
    case 'e':
      return 'Energy Counter';
    case 'p':
      return 'Phyrexian Mana';
    default:
      // For generic mana costs (numbers)
      if (/^\d+$/.test(symbol)) {
        return `${symbol} Generic Mana`;
      }
      // For hybrid mana like w/u
      if (symbol.includes('/')) {
        const [color1, color2] = symbol.split('/');
        return `Hybrid ${getSymbolName(color1)}/${getSymbolName(color2)}`;
      }
      return symbol;
  }
}

/**
 * Formats oracle text to replace mana symbols and other special symbols
 * with their icon representations
 */
export const formatOracleText = (text: string | null | undefined): React.ReactNode => {
  if (!text) return null;

  // Regular expression to match mana symbols in the format {X}
  const symbolRegex = /\{([^}]+)\}/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // Split the text into paragraphs
  const paragraphs = text.split('\n');

  return (
    <>
      {paragraphs.map((paragraph, pIndex) => {
        const paragraphParts: React.ReactNode[] = [];
        lastIndex = 0;

        // Reset the regex lastIndex
        symbolRegex.lastIndex = 0;

        // Find all mana symbols in this paragraph
        while ((match = symbolRegex.exec(paragraph)) !== null) {
          const [fullMatch, symbol] = match;
          const startIndex = match.index;

          // Add any text before the current symbol
          if (startIndex > lastIndex) {
            paragraphParts.push(paragraph.substring(lastIndex, startIndex));
          }

          // Add the symbol with the appropriate class
          paragraphParts.push(
            <i
              key={`${symbol}-${startIndex}-${pIndex}`}
              className={`ms ms-${symbol.toLowerCase()} ms-inline`}
              aria-label={getSymbolName(symbol)}
            />,
          );

          lastIndex = startIndex + fullMatch.length;
        }

        // Add any remaining text
        if (lastIndex < paragraph.length) {
          paragraphParts.push(paragraph.substring(lastIndex));
        }

        return <p key={pIndex}>{paragraphParts}</p>;
      })}
    </>
  );
};
