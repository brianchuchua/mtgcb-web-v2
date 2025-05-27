import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCardSearchParams,
  selectSetSearchParams,
  selectViewContentType,
  setArtist,
  setCardSearchName,
  setCardSearchParams,
  setColors,
  setOneResultPerCardName,
  setOracleText,
  setRarities,
  setSetCode,
  setSetSearchName,
  setSetSearchParams,
  setSets,
  setSortBy,
  setSortOrder,
  setStats,
  setTypes,
  setViewContentType,
} from '@/redux/slices/browseSlice';
import { ColorFilter, RarityFilter, SetFilter, TypeFilter } from '@/types/browse';

export function useInitializeBrowseFromUrl() {
  const urlSearchParams = useSearchParams();
  const viewContentType = useSelector(selectViewContentType);
  const reduxCardSearchParams = useSelector(selectCardSearchParams);
  const reduxSetSearchParams = useSelector(selectSetSearchParams);
  const dispatch = useDispatch();

  // Track if this is the first initialization
  const isFirstInitRef = useRef(true);

  // Track when the user makes an explicit selection
  const userSelectionRef = useRef<'cards' | 'sets' | null>(null);

  // Current content type value
  const currentType = viewContentType;

  // Track when viewContentType changes
  useEffect(() => {
    // If content type changes, consider it a user selection
    if (currentType && (!userSelectionRef.current || userSelectionRef.current !== currentType)) {
      userSelectionRef.current = currentType;
    }
  }, [currentType]);

  // Immediate first render effect to set content type ASAP
  // This runs before other effects and helps prevent initial content flash
  useEffect(() => {
    const contentTypeParam = urlSearchParams.get('contentType');
    if (contentTypeParam === 'sets') {
      dispatch(setViewContentType('sets'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle initial URL-based initialization
  useEffect(() => {
    // Only run this effect once on first mount
    if (!isFirstInitRef.current) {
      return;
    }

    // Get content type from URL
    const contentTypeParam = urlSearchParams.get('contentType');

    // Always respect the URL parameter on initial load
    if (contentTypeParam === 'sets') {
      // Make sure we're explicitly forcing the value 'sets' for type safety
      dispatch(setViewContentType('sets'));
      // Also mark this as a user selection to prevent override
      userSelectionRef.current = 'sets';
    } else {
      // Default to sets if no content type in URL
      dispatch(setViewContentType('sets'));
      // Don't set user selection since this is default behavior
    }

    // Mark first initialization as complete
    isFirstInitRef.current = false;
  }, [dispatch, urlSearchParams]);

  useEffect(() => {
    // This effect is for initializing search parameters, not content type
    // Content type is already handled in the previous effect

    // Skip initialization if we already have data in the redux store
    const hasCardParams = Object.keys(reduxCardSearchParams).length > 0;
    const hasSetParams = Object.keys(reduxSetSearchParams).length > 0;

    // If both types already have params, skip initialization
    if (hasCardParams && hasSetParams) {
      return;
    }

    // Get content type from URL to determine which params to process
    const contentTypeParam = urlSearchParams.get('contentType');

    // Determine which content type we're initializing for
    // Prioritize URL parameter over current Redux state since this is initial loading
    const effectiveContentType = contentTypeParam === 'sets' ? 'sets' : 'cards';

    // Common parameters that may apply to either content type
    const name = urlSearchParams.get('name');
    const setName = urlSearchParams.get('setName');
    const sortBy = urlSearchParams.get('sortBy');
    const sortOrder = urlSearchParams.get('sortOrder');

    // Initialize card parameters if needed
    if (!hasCardParams) {
      // Process card-specific URL parameters
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

      // Sets name field for cards
      if (effectiveContentType === 'cards') {
        // Only use 'name' parameter for cards view
        if (name) {
          dispatch(setCardSearchName(name));
        }
      }

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

      // Process individual card-specific parameters
      if (oracleText) {
        dispatch(setOracleText(oracleText));
      }

      if (artist) {
        dispatch(setArtist(artist));
      }

      if (oneResultPerCardName) {
        dispatch(setOneResultPerCardName(true));
      }

      // Set sort parameters for cards if we're in cards view
      if (effectiveContentType === 'cards') {
        if (sortBy) {
          dispatch(setSortBy(sortBy as any));
        }

        if (sortOrder) {
          dispatch(setSortOrder(sortOrder as 'asc' | 'desc'));
        }
      }
    }

    // Initialize set parameters if needed
    if (!hasSetParams) {
      // Set name field for sets
      if (effectiveContentType === 'sets') {
        // Prefer the dedicated setName parameter, fall back to name for backwards compatibility
        const setNameValue = setName || name;
        if (setNameValue) {
          dispatch(setSetSearchName(setNameValue));
        }

        // Get code from URL
        const code = urlSearchParams.get('code');
        if (code) {
          dispatch(setSetCode(code));
        }
      }

      // Set sort parameters for sets if we're in sets view
      if (effectiveContentType === 'sets') {
        if (sortBy) {
          dispatch(setSortBy(sortBy as any));
        }

        if (sortOrder) {
          dispatch(setSortOrder(sortOrder as 'asc' | 'desc'));
        }
      }
    }
  }, [urlSearchParams, reduxCardSearchParams, reduxSetSearchParams, dispatch]);
}
