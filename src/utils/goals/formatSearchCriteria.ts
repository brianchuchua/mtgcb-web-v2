import { CardApiParams } from '@/api/browse/types';

interface SearchCriteriaDescription {
  conditions: Omit<CardApiParams, 'limit' | 'offset' | 'sortBy' | 'sortDirection'>;
  sort?: string;
  order?: 'asc' | 'desc';
}

const RARITY_NAMES: Record<string, string> = {
  '1': 'Common',
  '2': 'Uncommon', 
  '3': 'Rare',
  '4': 'Mythic',
  '5': 'Special',
  '6': 'Special', // Sometimes Special is 6
};

const MTG_COLOR_NAMES: Record<string, string> = {
  'W': 'White',
  'U': 'Blue',
  'B': 'Black',
  'R': 'Red',
  'G': 'Green',
};

export function formatSearchCriteria(searchCriteria: SearchCriteriaDescription, onePrintingPerPureName?: boolean): string {
  const { conditions } = searchCriteria;
  const parts: string[] = [];
  const typeParts: string[] = [];
  const colorPart: string[] = [];
  const attributeParts: string[] = [];
  
  // Check if we only have specific card IDs
  const hasOnlyCardIds = conditions.id && Object.keys(conditions).filter(
    key => key !== 'id'
  ).length === 0;

  // Types - collect them separately for better formatting
  if (conditions.type) {
    if (conditions.type.AND && conditions.type.AND.length > 0) {
      const cleanTypes = conditions.type.AND.map((t: string) => t.replace(/"/g, ''));
      // Check for common patterns
      if (cleanTypes.includes('Legendary') && cleanTypes.includes('Dragon')) {
        typeParts.push('Legendary Dragon');
      } else if (cleanTypes.includes('Legendary') && cleanTypes.includes('Creature')) {
        typeParts.push('Legendary Creature');
      } else if (cleanTypes.length === 1) {
        typeParts.push(cleanTypes[0]);
      } else {
        typeParts.push(cleanTypes.join(' '));
      }
    }
    
    if (conditions.type.NOT && conditions.type.NOT.length > 0) {
      const excludedTypes = conditions.type.NOT.map((t: string) => `non-${t.replace(/"/g, '')}`);
      typeParts.push(...excludedTypes);
    }
  }

  // Colors
  if (conditions.colors_array) {
    if (conditions.colors_array.exactly && conditions.colors_array.exactly.length === 0) {
      colorPart.push('Colorless');
    } else if (conditions.colors_array.exactly) {
      const colorNames = conditions.colors_array.exactly.map((c: string) => MTG_COLOR_NAMES[c] || c);
      if (conditions.colors_array.exactly.length === 1) {
        colorPart.push(colorNames[0]);
      } else {
        colorPart.push(colorNames.join('/'));
      }
    } else if (conditions.colors_array.atLeast) {
      const colorNames = conditions.colors_array.atLeast.map((c: string) => MTG_COLOR_NAMES[c] || c);
      colorPart.push(`with ${colorNames.join('/')}`);
    } else if (conditions.colors_array.atMost) {
      const colorNames = conditions.colors_array.atMost.map((c: string) => MTG_COLOR_NAMES[c] || c);
      if (conditions.colors_array.atMost.length === 1 && conditions.colors_array.atMost[0] === 'W') {
        colorPart.push('non-White');
      } else {
        colorPart.push(`without ${colorNames.join('/')}`);
      }
    }
  }

  // Rarities
  const rarityPart: string[] = [];
  if (conditions.rarityNumeric) {
    const rarities: string[] = [];
    const excludedRarities: string[] = [];
    
    if (conditions.rarityNumeric.OR) {
      conditions.rarityNumeric.OR.forEach((r: string) => {
        const match = r.match(/^=(\d+)$/);
        if (match) {
          const rarityName = RARITY_NAMES[match[1]];
          if (rarityName) rarities.push(rarityName);
        }
      });
    }
    
    if (conditions.rarityNumeric.AND) {
      conditions.rarityNumeric.AND.forEach((r: string) => {
        const match = r.match(/^!=(\d+)$/);
        if (match) {
          const rarityName = RARITY_NAMES[match[1]];
          if (rarityName) excludedRarities.push(rarityName);
        }
      });
    }
    
    if (rarities.length > 0) {
      rarityPart.push(rarities.join('/'));
    }
    
    if (excludedRarities.length > 0) {
      rarityPart.push(`non-${excludedRarities.join('/non-')}`);
    }
  }

  // Oracle text
  if (conditions.oracleText) {
    attributeParts.push(`with "${conditions.oracleText}" in text`);
  }

  // Artist
  if (conditions.artist) {
    attributeParts.push(`by ${conditions.artist}`);
  }

  // Sets
  if (conditions.setId) {
    if (conditions.setId.OR && conditions.setId.OR.length > 0) {
      attributeParts.push(`specific sets`);
    }
    
    if (conditions.setId.AND && conditions.setId.AND.length > 0) {
      // Count excluded sets
      const excludedCount = conditions.setId.AND.filter((s: string) => s.startsWith('!=')).length;
      if (excludedCount > 0) {
        attributeParts.push(`excluding ${excludedCount} set${excludedCount > 1 ? 's' : ''}`);
      }
    }
  }
  
  // Specific cards
  if (conditions.id) {
    const includedCards = conditions.id.OR?.length || 0;
    const excludedCards = conditions.id.AND?.filter((id: string) => id.startsWith('!=')).length || 0;
    
    const cardParts: string[] = [];
    if (includedCards > 0) {
      cardParts.push(`including ${includedCards} specific card${includedCards > 1 ? 's' : ''}`);
    }
    if (excludedCards > 0) {
      cardParts.push(`excluding ${excludedCards} specific card${excludedCards > 1 ? 's' : ''}`);
    }
    
    if (cardParts.length > 0) {
      attributeParts.push(`(${cardParts.join(' and ')})`);
    }
  }
  
  // One result per card name (hide duplicate printings) - but not if we only have card IDs
  if (!hasOnlyCardIds && onePrintingPerPureName !== undefined) {
    if (onePrintingPerPureName) {
      attributeParts.push(`(one printing of each card)`);
    } else {
      attributeParts.push(`(every printing of each card)`);
    }
  }

  // Stats
  const statConditions: string[] = [];
  
  if (conditions.convertedManaCost?.AND) {
    const manaConditions = conditions.convertedManaCost.AND.map((c: string) => `MV ${c}`);
    statConditions.push(...manaConditions);
  }
  
  if (conditions.powerNumeric?.AND) {
    const powerConditions = conditions.powerNumeric.AND.map((c: string) => `Power ${c}`);
    statConditions.push(...powerConditions);
  }
  
  if (conditions.toughnessNumeric?.AND) {
    const toughnessConditions = conditions.toughnessNumeric.AND.map((c: string) => `Toughness ${c}`);
    statConditions.push(...toughnessConditions);
  }
  
  if (conditions.loyaltyNumeric?.AND) {
    const loyaltyConditions = conditions.loyaltyNumeric.AND.map((c: string) => `Loyalty ${c}`);
    statConditions.push(...loyaltyConditions);
  }
  
  // Price filters
  if (conditions.market?.AND) {
    const marketConditions = conditions.market.AND.map((c: string) => {
      const match = c.match(/^([<>=!]+)(.+)$/);
      if (match) {
        return `Market Price ${match[1]} $${match[2]}`;
      }
      return `Market Price ${c}`;
    });
    statConditions.push(...marketConditions);
  }
  
  if (conditions.low?.AND) {
    const lowConditions = conditions.low.AND.map((c: string) => {
      const match = c.match(/^([<>=!]+)(.+)$/);
      if (match) {
        return `Low Price ${match[1]} $${match[2]}`;
      }
      return `Low Price ${c}`;
    });
    statConditions.push(...lowConditions);
  }
  
  if (conditions.average?.AND) {
    const avgConditions = conditions.average.AND.map((c: string) => {
      const match = c.match(/^([<>=!]+)(.+)$/);
      if (match) {
        return `Average Price ${match[1]} $${match[2]}`;
      }
      return `Average Price ${c}`;
    });
    statConditions.push(...avgConditions);
  }
  
  if (conditions.high?.AND) {
    const highConditions = conditions.high.AND.map((c: string) => {
      const match = c.match(/^([<>=!]+)(.+)$/);
      if (match) {
        return `High Price ${match[1]} $${match[2]}`;
      }
      return `High Price ${c}`;
    });
    statConditions.push(...highConditions);
  }
  
  if (conditions.foil?.AND) {
    const foilConditions = conditions.foil.AND.map((c: string) => {
      const match = c.match(/^([<>=!]+)(.+)$/);
      if (match) {
        return `Foil Price ${match[1]} $${match[2]}`;
      }
      return `Foil Price ${c}`;
    });
    statConditions.push(...foilConditions);
  }
  
  if (statConditions.length > 0) {
    attributeParts.push(`(${statConditions.join(', ')})`);
  }

  // Build the final description
  const mainParts: string[] = [];
  
  // Start with card name if specified
  if (conditions.name) {
    // If we have a name and types, format it specially
    if (typeParts.length > 0) {
      mainParts.push(`${typeParts.join(' ')} named "${conditions.name}"`);
    } else {
      mainParts.push(`card named "${conditions.name}"`);
    }
  } else {
    // Otherwise, compose: [color] [rarity] [type]
    const cardDescParts: string[] = [];
    if (colorPart.length > 0) cardDescParts.push(...colorPart);
    if (rarityPart.length > 0) cardDescParts.push(...rarityPart);
    if (typeParts.length > 0) cardDescParts.push(...typeParts);
    
    if (cardDescParts.length > 0) {
      mainParts.push(cardDescParts.join(' '));
    }
  }
  
  // Add other attributes (these apply whether or not we have a name)
  if (attributeParts.length > 0) {
    mainParts.push(...attributeParts);
  }

  // Special case: if only specific cards are selected (no other criteria except maybe oneResultPerCardName)
  if (hasOnlyCardIds) {
    const includedCards = conditions.id.OR?.length || 0;
    const excludedCards = conditions.id.AND?.filter((id: string) => id.startsWith('!=')).length || 0;
    
    if (includedCards > 0 && excludedCards === 0) {
      return `${includedCards} specific card${includedCards > 1 ? 's' : ''}`;
    } else if (includedCards === 0 && excludedCards > 0) {
      return `every card except ${excludedCards} specific card${excludedCards > 1 ? 's' : ''}`;
    } else if (includedCards > 0 && excludedCards > 0) {
      return `${includedCards} specific card${includedCards > 1 ? 's' : ''} (excluding ${excludedCards} other${excludedCards > 1 ? 's' : ''})`;
    }
  }
  
  // If no criteria specified
  if (mainParts.length === 0) {
    return 'every card';
  }

  // Join all parts
  return mainParts.join(' ');
}

export function formatGoalDescription(
  searchCriteria: SearchCriteriaDescription,
  targetQuantityReg: number | null,
  targetQuantityFoil: number | null,
  targetQuantityAll: number | null
): string {
  const criteriaText = formatSearchCriteria(searchCriteria);
  
  // Determine quantity text
  let quantityText = '';
  if (targetQuantityAll) {
    quantityText = `${targetQuantityAll}x of`;
  } else if (targetQuantityReg && targetQuantityFoil) {
    quantityText = `${targetQuantityReg}x regular and ${targetQuantityFoil}x foil of`;
  } else if (targetQuantityReg) {
    quantityText = `${targetQuantityReg}x regular of`;
  } else if (targetQuantityFoil) {
    quantityText = `${targetQuantityFoil}x foil of`;
  } else {
    quantityText = '1x of';
  }

  return `${quantityText} ${criteriaText}`;
}