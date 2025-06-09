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

export function formatSearchCriteria(searchCriteria: SearchCriteriaDescription): string {
  const { conditions } = searchCriteria;
  const parts: string[] = [];
  const typeParts: string[] = [];
  const colorPart: string[] = [];
  const attributeParts: string[] = [];

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
    
    if (conditions.rarityNumeric.OR) {
      conditions.rarityNumeric.OR.forEach((r: string) => {
        const match = r.match(/^=(\d+)$/);
        if (match) {
          const rarityName = RARITY_NAMES[match[1]];
          if (rarityName) rarities.push(rarityName);
        }
      });
    }
    
    if (rarities.length > 0) {
      rarityPart.push(rarities.join('/'));
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
      attributeParts.push(`from specific sets`);
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
  
  if (statConditions.length > 0) {
    attributeParts.push(`(${statConditions.join(', ')})`);
  }

  // Build the final description
  // Start with card name if specified
  if (conditions.name) {
    return `card named "${conditions.name}"`;
  }

  // Otherwise, compose: [color] [rarity] [type] [attributes]
  const mainParts: string[] = [];
  
  // Add color + rarity + type as one unit
  const cardDescParts: string[] = [];
  if (colorPart.length > 0) cardDescParts.push(...colorPart);
  if (rarityPart.length > 0) cardDescParts.push(...rarityPart);
  if (typeParts.length > 0) cardDescParts.push(...typeParts);
  
  if (cardDescParts.length > 0) {
    mainParts.push(cardDescParts.join(' '));
  }
  
  // Add other attributes
  if (attributeParts.length > 0) {
    mainParts.push(...attributeParts);
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