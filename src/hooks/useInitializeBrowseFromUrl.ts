import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectSearchParams,
  selectViewContentType,
  setColors,
  setOneResultPerCardName,
  setRarities,
  setSearchName,
  setSearchParams,
  setSets,
  setSortBy,
  setSortOrder,
  setTypes,
  setViewContentType,
} from '@/redux/slices/browseSlice';
import { ColorFilter, RarityFilter, SetFilter, TypeFilter } from '@/types/browse';

export function useInitializeBrowseFromUrl() {
  const urlSearchParams = useSearchParams();
  const reduxSearchParams = useSelector(selectSearchParams);
  const viewContentType = useSelector(selectViewContentType);
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if we already have search params in Redux
    const hasExistingParams = Object.keys(reduxSearchParams).length > 0;

    // Skip initialization if we already have search params
    if (hasExistingParams) {
      return;
    }

    // Get content type
    const contentTypeParam = urlSearchParams.get('contentType');
    if (contentTypeParam === 'sets' && viewContentType !== 'sets') {
      dispatch(setViewContentType('sets'));
    }

    // Process URL parameters
    const name = urlSearchParams.get('name');
    const oracleText = urlSearchParams.get('oracleText');
    const artist = urlSearchParams.get('artist');
    const oneResultPerCardName = urlSearchParams.get('oneResultPerCardName') === 'true';
    const colorless = urlSearchParams.get('colorless') === 'true';
    const colors = urlSearchParams.get('colors');
    const colorMatchType = urlSearchParams.get('colorMatchType');
    const includeTypes = urlSearchParams.get('includeTypes');
    const excludeTypes = urlSearchParams.get('excludeTypes');
    const includeRarities = urlSearchParams.get('includeRarities');
    const excludeRarities = urlSearchParams.get('excludeRarities');
    const includeSets = urlSearchParams.get('includeSets');
    const excludeSets = urlSearchParams.get('excludeSets');
    const sortBy = urlSearchParams.get('sortBy');
    const sortOrder = urlSearchParams.get('sortOrder');

    // Process colors
    if (colors || colorless) {
      const colorFilter: ColorFilter = {
        colors: colors ? colors.split(',') : [],
        matchType: (colorMatchType as 'exactly' | 'atLeast' | 'atMost') || 'exactly',
        includeColorless: colorless,
      };
      dispatch(setColors(colorFilter));
    }

    // Process types
    if (includeTypes || excludeTypes) {
      const typeFilter: TypeFilter = {
        include: includeTypes ? includeTypes.split('|') : [],
        exclude: excludeTypes ? excludeTypes.split('|') : [],
      };
      dispatch(setTypes(typeFilter));
    }

    // Process rarities
    if (includeRarities || excludeRarities) {
      const rarityFilter: RarityFilter = {
        include: includeRarities ? includeRarities.split('|') : [],
        exclude: excludeRarities ? excludeRarities.split('|') : [],
      };
      dispatch(setRarities(rarityFilter));
    }

    // Process sets
    if (includeSets || excludeSets) {
      const setFilter: SetFilter = {
        include: includeSets ? includeSets.split('|') : [],
        exclude: excludeSets ? excludeSets.split('|') : [],
      };
      dispatch(setSets(setFilter));
    }

    // Process stats (complex parameters like power, toughness, cmc)
    const statsParam = urlSearchParams.get('stats');
    if (statsParam) {
      const statFilters: { [key: string]: string[] } = {};

      // Format: "power=gte1|lte3,toughness=gte2"
      const statGroups = statsParam.split(',');
      statGroups.forEach((group) => {
        const [attribute, conditions] = group.split('=');
        if (attribute && conditions) {
          statFilters[attribute] = conditions.split('|');
        }
      });

      if (Object.keys(statFilters).length > 0) {
        dispatch(setStats(statFilters));
      }
    }

    // Process individual parameters
    if (name) {
      dispatch(setSearchName(name));
    }

    if (oracleText) {
      dispatch(setOracleText(oracleText));
    }

    if (artist) {
      dispatch(setArtist(artist));
    }

    if (oneResultPerCardName) {
      dispatch(setOneResultPerCardName(true));
    }

    if (sortBy) {
      dispatch(setSortBy(sortBy as any));
    }

    if (sortOrder) {
      dispatch(setSortOrder(sortOrder as 'asc' | 'desc'));
    }
  }, [urlSearchParams, reduxSearchParams, viewContentType, dispatch]);
}

// Helper function to extract the stats parameter
function setStats(statFilters: { [key: string]: string[] }) {
  return {
    type: 'browse/setStats',
    payload: statFilters,
  };
}

// Helper function for oracle text
function setOracleText(text: string) {
  return {
    type: 'browse/setOracleText',
    payload: text,
  };
}

// Helper function for artist
function setArtist(artist: string) {
  return {
    type: 'browse/setArtist',
    payload: artist,
  };
}
