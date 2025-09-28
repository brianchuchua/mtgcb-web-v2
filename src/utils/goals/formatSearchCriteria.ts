import { CardApiParams } from '@/api/browse/types';

interface SearchCriteriaDescription {
  conditions: Omit<CardApiParams, 'limit' | 'offset' | 'sortBy' | 'sortDirection'> & {
    quantityReg?: { AND: string[] };
    quantityFoil?: { AND: string[] };
    quantityAll?: { AND: string[] };
  };
  sort?: string;
  order?: 'asc' | 'desc';
}

const RARITY_NAMES: Record<string, string> = {
  '2': 'Common',
  '3': 'Uncommon',
  '4': 'Rare',
  '5': 'Mythic',
  '6': 'Special',
};

const MTG_COLOR_NAMES: Record<string, string> = {
  W: 'White',
  U: 'Blue',
  B: 'Black',
  R: 'Red',
  G: 'Green',
};

export function formatSearchCriteria(
  searchCriteria: SearchCriteriaDescription,
  onePrintingPerPureName?: boolean,
  isForGoal: boolean = true,
  isSetPage?: boolean,
): string {
  const { conditions } = searchCriteria;
  const parts: string[] = [];
  const typeParts: string[] = [];
  const colorPart: string[] = [];
  const attributeParts: string[] = [];

  // Check if we only have specific card IDs
  const hasOnlyCardIds = conditions.id && Object.keys(conditions).filter((key) => key !== 'id').length === 0;

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
        colorPart.push(`only ${colorNames[0]}`);
      } else {
        colorPart.push(`only ${colorNames.join('/')}`);
      }
    } else if (conditions.colors_array.atLeast) {
      const colorNames = conditions.colors_array.atLeast.map((c: string) => MTG_COLOR_NAMES[c] || c);
      colorPart.push(`with ${colorNames.join('/')}`);
    } else if (conditions.colors_array.atMost) {
      const colorNames = conditions.colors_array.atMost.map((c: string) => MTG_COLOR_NAMES[c] || c);
      colorPart.push(`at most ${colorNames.join('/')}`);
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
    attributeParts.push(`by artist "${conditions.artist}"`);
  }

  // Reserved List
  if (conditions.isReserved === true) {
    attributeParts.push(`(Reserved List only)`);
  } else if (conditions.isReserved === false) {
    attributeParts.push(`(excluding Reserved List)`);
  }

  // Sets - handle separately to place at the end (skip if on a set page for search descriptions)
  let setsPart = '';
  let setsExcludePart = '';
  if (conditions.setId && (!isSetPage || isForGoal)) {
    if (conditions.setId.OR && conditions.setId.OR.length > 0) {
      const setCount = conditions.setId.OR.length;
      setsPart = `from specific set${setCount > 1 ? 's' : ''}`;
    }

    if (conditions.setId.AND && conditions.setId.AND.length > 0) {
      // Count excluded sets
      const excludedCount = conditions.setId.AND.filter((s: string) => s.startsWith('!=')).length;
      if (excludedCount > 0) {
        setsExcludePart = `excluding ${excludedCount} set${excludedCount > 1 ? 's' : ''}`;
      }
    }
  }

  // Set Categories
  if (conditions.setCategory) {
    const setCategoryParts: string[] = [];
    const categoryNames: Record<string, string> = {
      normal: 'normal',
      sealed: 'sealed',
      special: 'special',
    };

    if (typeof conditions.setCategory === 'string') {
      const categoryName = categoryNames[conditions.setCategory] || conditions.setCategory;
      setCategoryParts.push(`from ${categoryName} category`);
    } else if (Array.isArray(conditions.setCategory)) {
      const names = conditions.setCategory.map((c: string) => categoryNames[c] || c);
      if (names.length === 1) {
        setCategoryParts.push(`from ${names[0]} category`);
      } else {
        setCategoryParts.push(`from ${names.join('/')} categories`);
      }
    } else if (conditions.setCategory.OR && conditions.setCategory.OR.length > 0) {
      const names = conditions.setCategory.OR.map((c: string) => categoryNames[c] || c);
      if (names.length === 1) {
        setCategoryParts.push(`from ${names[0]} category`);
      } else {
        setCategoryParts.push(`from ${names.join('/')} categories`);
      }
    } else if (conditions.setCategory.NOT && conditions.setCategory.NOT.length > 0) {
      const names = conditions.setCategory.NOT.map((c: string) => categoryNames[c] || c);
      if (names.length === 1) {
        setCategoryParts.push(`not from ${names[0]} category`);
      } else {
        setCategoryParts.push(`not from ${names.join('/')} categories`);
      }
    }

    if (setCategoryParts.length > 0) {
      attributeParts.push(...setCategoryParts);
    }
  }

  // Set Types
  if (conditions.setType) {
    const setTypeParts: string[] = [];

    if (typeof conditions.setType === 'string') {
      setTypeParts.push(`from ${conditions.setType} sets`);
    } else if (Array.isArray(conditions.setType)) {
      if (conditions.setType.length === 1) {
        setTypeParts.push(`from ${conditions.setType[0]} sets`);
      } else {
        setTypeParts.push(`from ${conditions.setType.join('/')} sets`);
      }
    } else if (conditions.setType.OR && conditions.setType.OR.length > 0) {
      if (conditions.setType.OR.length === 1) {
        setTypeParts.push(`from ${conditions.setType.OR[0]} sets`);
      } else {
        setTypeParts.push(`from ${conditions.setType.OR.join('/')} sets`);
      }
    } else if (conditions.setType.NOT && conditions.setType.NOT.length > 0) {
      if (conditions.setType.NOT.length === 1) {
        setTypeParts.push(`not from ${conditions.setType.NOT[0]} sets`);
      } else {
        setTypeParts.push(`not from ${conditions.setType.NOT.join('/')} sets`);
      }
    }

    if (setTypeParts.length > 0) {
      attributeParts.push(...setTypeParts);
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
      attributeParts.push(`(any printing of each card)`);
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

  // Quantity filters - extract them separately to display at the beginning
  let quantityText: string | null = null;

  if (conditions.quantityAll?.AND) {
    // If we have total quantity, use that (like goals do with targetQuantityAll)
    conditions.quantityAll.AND.forEach((c: string) => {
      const match = c.match(/^([<>=!]+)(.+)$/);
      if (match) {
        const op = match[1];
        const value = match[2];
        if (op === '=') {
          quantityText = `${value}x`;
        } else {
          quantityText = `${op} ${value}x`;
        }
      }
    });
  } else {
    // Check for separate regular and foil quantities
    let regPart: string | null = null;
    let foilPart: string | null = null;

    if (conditions.quantityReg?.AND) {
      conditions.quantityReg.AND.forEach((c: string) => {
        const match = c.match(/^([<>=!]+)(.+)$/);
        if (match) {
          const op = match[1];
          const value = match[2];
          if (op === '=') {
            regPart = `${value}x`;
          } else {
            regPart = `${op} ${value}x`;
          }
        }
      });
    }

    if (conditions.quantityFoil?.AND) {
      conditions.quantityFoil.AND.forEach((c: string) => {
        const match = c.match(/^([<>=!]+)(.+)$/);
        if (match) {
          const op = match[1];
          const value = match[2];
          if (op === '=') {
            foilPart = `${value}x foil`;
          } else {
            foilPart = `${op} ${value}x foil`;
          }
        }
      });
    }

    if (regPart && foilPart) {
      quantityText = `${regPart} and ${foilPart}`;
    } else if (regPart) {
      quantityText = regPart;
    } else if (foilPart) {
      quantityText = foilPart;
    }
  }

  if (statConditions.length > 0) {
    attributeParts.push(`(${statConditions.join(', ')})`);
  }

  // Build the final description
  const mainParts: string[] = [];

  // For search descriptions (not goals), we'll structure it differently
  if (!isForGoal) {
    // If we have quantity filters, format like goals do
    if (quantityText) {
      // Start with quantity
      if (conditions.name) {
        // If we have a name, include it along with colors/rarity/types
        const cardDescParts: string[] = [];
        if (colorPart.length > 0) cardDescParts.push(...colorPart);
        if (rarityPart.length > 0) cardDescParts.push(...rarityPart);
        if (typeParts.length > 0) cardDescParts.push(...typeParts);

        if (cardDescParts.length > 0) {
          mainParts.push(`cards: ${quantityText} of ${cardDescParts.join(' ')} named "${conditions.name}"`);
        } else {
          mainParts.push(`cards: ${quantityText} matching "${conditions.name}"`);
        }
      } else {
        // Otherwise, compose: cards: [quantity] of [color] [rarity] [type]
        const cardDescParts: string[] = [];
        if (colorPart.length > 0) cardDescParts.push(...colorPart);
        if (rarityPart.length > 0) cardDescParts.push(...rarityPart);
        if (typeParts.length > 0) cardDescParts.push(...typeParts);

        if (cardDescParts.length > 0) {
          mainParts.push(`cards: ${quantityText} of ${cardDescParts.join(' ')}`);
        } else {
          // Just quantity filter, no other filters
          mainParts.push(`cards: ${quantityText}`);
        }
      }
    } else {
      // No quantity filter, original logic
      if (conditions.name) {
        // If we have a name, include it along with colors/rarity/types
        const cardDescParts: string[] = [];
        if (colorPart.length > 0) cardDescParts.push(...colorPart);
        if (rarityPart.length > 0) cardDescParts.push(...rarityPart);
        if (typeParts.length > 0) cardDescParts.push(...typeParts);

        if (cardDescParts.length > 0) {
          mainParts.push(`cards: ${cardDescParts.join(' ')} named "${conditions.name}"`);
        } else {
          mainParts.push(`cards matching "${conditions.name}"`);
        }
      } else {
        // Otherwise, compose: cards: [color] [rarity] [type]
        const cardDescParts: string[] = [];
        if (colorPart.length > 0) cardDescParts.push(...colorPart);
        if (rarityPart.length > 0) cardDescParts.push(...rarityPart);
        if (typeParts.length > 0) cardDescParts.push(...typeParts);

        if (cardDescParts.length > 0) {
          mainParts.push(`cards: ${cardDescParts.join(' ')}`);
        }
      }
    }
  } else {
    // For goals, keep the original format
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
  }

  // Add other attributes (these apply whether or not we have a name)
  if (attributeParts.length > 0) {
    mainParts.push(...attributeParts);
  }

  // Special case: if only specific cards are selected (no other criteria except maybe oneResultPerCardName)
  if (hasOnlyCardIds) {
    const includedCards = conditions.id.OR?.length || 0;
    const excludedCards = conditions.id.AND?.filter((id: string) => id.startsWith('!=')).length || 0;

    if (isForGoal) {
      // For goals, use the original format without forcing "cards" at the end
      if (includedCards > 0 && excludedCards === 0) {
        return `${includedCards} specific card${includedCards > 1 ? 's' : ''}`;
      } else if (includedCards === 0 && excludedCards > 0) {
        return `every card except ${excludedCards} specific card${excludedCards > 1 ? 's' : ''}`;
      } else if (includedCards > 0 && excludedCards > 0) {
        return `${includedCards} specific card${includedCards > 1 ? 's' : ''} (excluding ${excludedCards} other${excludedCards > 1 ? 's' : ''})`;
      }
    } else {
      // For search descriptions, always use "cards"
      if (includedCards > 0 && excludedCards === 0) {
        return `${includedCards} specific cards`;
      } else if (includedCards === 0 && excludedCards > 0) {
        return `all cards except ${excludedCards} specific cards`;
      } else if (includedCards > 0 && excludedCards > 0) {
        return `${includedCards} specific cards (excluding ${excludedCards} others)`;
      }
    }
  }

  // If no criteria specified except possibly sets
  if (mainParts.length === 0) {
    // Check if we only have set filters
    if (setsPart && !setsExcludePart) {
      return isForGoal ? `every card ${setsPart}` : `cards: all ${setsPart}`;
    } else if (setsPart && setsExcludePart) {
      return isForGoal ? `every card ${setsPart} ${setsExcludePart}` : `cards: all ${setsPart} ${setsExcludePart}`;
    } else if (!setsPart && setsExcludePart) {
      return isForGoal ? `every card ${setsExcludePart}` : `cards: all ${setsExcludePart}`;
    }
    return isForGoal ? 'every card' : 'cards: all';
  }

  // Join all parts
  let result = mainParts.join(' ');

  // Add sets part at the end if present
  if (setsPart) {
    result = `${result} ${setsPart}`;
  }

  if (setsExcludePart) {
    result = `${result} ${setsExcludePart}`;
  }

  return result;
}

export function formatGoalDescription(
  searchCriteria: SearchCriteriaDescription,
  targetQuantityReg: number | null,
  targetQuantityFoil: number | null,
  targetQuantityAll: number | null,
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
