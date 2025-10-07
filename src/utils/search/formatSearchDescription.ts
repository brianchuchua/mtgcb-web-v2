import { CardApiParams } from '@/api/browse/types';
import { BrowseSearchParams } from '@/types/browse';
import { formatSearchCriteria } from '@/utils/goals/formatSearchCriteria';
import { buildApiParamsFromSearchParams } from '@/utils/searchParamsConverter';

/**
 * Converts browse search params to a human-readable description
 * @param searchParams - The search parameters from Redux
 * @param contentType - Whether we're searching cards or sets
 * @param onePrintingPerPureName - Whether to show one printing per card
 * @param selectedGoalId - The selected goal ID if any
 * @param showGoals - How to filter by goals
 * @param selectedLocationId - The selected location ID if any
 * @param includeChildLocations - Whether to include child locations
 * @param isSetPage - Whether we're on a specific set page
 * @returns A human-readable description of the search
 */
export function formatSearchDescription(
  searchParams: BrowseSearchParams,
  contentType: 'cards' | 'sets' = 'cards',
  onePrintingPerPureName?: boolean,
  selectedGoalId?: number | null,
  showGoals?: string,
  selectedLocationId?: number | null,
  includeChildLocations?: boolean,
  isSetPage?: boolean
): string {
  // For sets, we don't use the formatSearchCriteria function
  if (contentType === 'sets') {
    const parts: string[] = [];
    
    if (searchParams.name) {
      parts.push(`matching "${searchParams.name}"`);
    }
    
    if (searchParams.code) {
      parts.push(`code "${searchParams.code}"`);
    }
    
    if (searchParams.setCategories) {
      const { include, exclude } = searchParams.setCategories;
      if (include.length > 0) {
        parts.push(`${include.join('/')}`);
      }
      if (exclude.length > 0) {
        parts.push(`excluding ${exclude.join('/')}`);
      }
    }
    
    if (searchParams.setTypes) {
      const { include, exclude } = searchParams.setTypes;
      if (include.length > 0) {
        parts.push(`${include.join('/')}`);
      }
      if (exclude.length > 0) {
        parts.push(`not ${exclude.join('/')}`);
      }
    }
    
    if (searchParams.completionStatus) {
      const { include, exclude } = searchParams.completionStatus;
      if (include.length > 0) {
        const statusText = include.map(s => {
          if (s === 'complete') return 'complete';
          if (s === 'partial') return 'partial';
          if (s === 'empty') return 'not started';
          return s;
        });
        parts.push(statusText.join('/'));
      }
      if (exclude.length > 0) {
        const statusText = exclude.map(s => {
          if (s === 'complete') return 'incomplete';
          if (s === 'partial') return 'not partial';
          if (s === 'empty') return 'started';
          return s;
        });
        parts.push(statusText.join('/'));
      }
    }
    
    if (searchParams.showSubsets === false) {
      parts.push('main only');
    }
    
    let description = parts.length > 0 ? `sets: ${parts.join(', ')}` : 'sets: all';
    
    // Add goal information for sets
    if (selectedGoalId) {
      if (showGoals === 'needed') {
        description += ' with cards needed for goal';
      } else if (showGoals === 'met') {
        description += ' with cards completed for goal';
      } else {
        description += ' for goal';
      }
    }
    
    return description;
  }
  
  // For cards, convert to API params and use formatSearchCriteria
  const apiParams = buildApiParamsFromSearchParams(searchParams, 'cards') as Partial<CardApiParams>;
  
  // Convert API params to the format expected by formatSearchCriteria
  const searchCriteria = {
    conditions: {
      ...(apiParams.name && { name: apiParams.name }),
      ...(apiParams.oracleText && { oracleText: apiParams.oracleText }),
      ...(apiParams.artist && { artist: apiParams.artist }),
      ...(apiParams.colors_array && { colors_array: apiParams.colors_array }),
      ...(apiParams.type && { type: apiParams.type }),
      ...(apiParams.layout && { layout: apiParams.layout }),
      ...(apiParams.rarityNumeric && { rarityNumeric: apiParams.rarityNumeric }),
      ...(apiParams.setId && { setId: apiParams.setId }),
      ...(apiParams.convertedManaCost && { convertedManaCost: apiParams.convertedManaCost }),
      ...(apiParams.powerNumeric && { powerNumeric: apiParams.powerNumeric }),
      ...(apiParams.toughnessNumeric && { toughnessNumeric: apiParams.toughnessNumeric }),
      ...(apiParams.loyaltyNumeric && { loyaltyNumeric: apiParams.loyaltyNumeric }),
      ...(apiParams.market && { market: apiParams.market }),
      ...(apiParams.low && { low: apiParams.low }),
      ...(apiParams.average && { average: apiParams.average }),
      ...(apiParams.high && { high: apiParams.high }),
      ...(apiParams.foil && { foil: apiParams.foil }),
      ...(apiParams.quantityReg && { quantityReg: apiParams.quantityReg }),
      ...(apiParams.quantityFoil && { quantityFoil: apiParams.quantityFoil }),
      ...(apiParams.quantityAll && { quantityAll: apiParams.quantityAll }),
    },
  };
  
  const hasFilters = Object.keys(searchCriteria.conditions).length > 0;
  let baseDescription = hasFilters 
    ? formatSearchCriteria(searchCriteria, onePrintingPerPureName, false, isSetPage)
    : 'cards: all';
  
  // Add goal information if selected
  if (selectedGoalId) {
    if (showGoals === 'needed') {
      baseDescription += ' needed for goal';
    } else if (showGoals === 'met') {
      baseDescription += ' completed for goal';
    } else {
      baseDescription += ' for goal';
    }
  }
  
  // Add location information if selected
  if (selectedLocationId) {
    baseDescription += includeChildLocations 
      ? ' in location (including sublocations)'
      : ' in location';
  }
  
  return baseDescription;
}