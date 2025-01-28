'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setSearchParams } from '@/redux/slices/browseSlice';
import { BrowseSearchParams, ColorMatchType } from '@/types/browse';

export const useInitializeBrowseFromUrl = () => {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  useEffect(() => {
    // Only run once on initial mount
    if (initialized.current) return;
    initialized.current = true;

    const params: BrowseSearchParams = {};

    // Handle name
    const name = searchParams.get('name');
    if (name) {
      params.name = name;
    }

    // Handle oracle text
    const oracleText = searchParams.get('oracleText');
    if (oracleText) {
      params.oracleText = oracleText;
    }

    // Handle color params
    const colorless = searchParams.get('colorless') === 'true';
    const colors = searchParams.get('colors');
    const colorMatchType = searchParams.get('colorMatchType') as ColorMatchType || 'exactly';

    if (colorless) {
      params.colors = {
        colors: [],
        matchType: 'exactly',
        includeColorless: true
      };
    } else if (colors) {
      params.colors = {
        colors: colors.split(','),
        matchType: colorMatchType,
        includeColorless: false
      };
    }

    // Handle type params
    const includeTypes = searchParams.get('includeTypes');
    const excludeTypes = searchParams.get('excludeTypes');

    if (includeTypes || excludeTypes) {
      params.types = {
        include: includeTypes ? includeTypes.split('|') : [],
        exclude: excludeTypes ? excludeTypes.split('|') : []
      };
    }

    // Set all params at once
    dispatch(setSearchParams(params));
  }, [dispatch, searchParams]);
};