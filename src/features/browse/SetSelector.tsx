'use client';

import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetAllSetsQuery } from '@/api/sets/setsApi';
import AutocompleteWithNegation, { Option } from '@/components/ui/AutocompleteWithNegation';
import { selectSets, setSets } from '@/redux/slices/browse';

const SetSelector = () => {
  const dispatch = useDispatch();
  const selectedSets = useSelector(selectSets);
  
  // Use RTK Query hook instead of direct fetch to benefit from caching
  const { data: setsResponse, isLoading } = useGetAllSetsQuery();
  
  // Sort sets by releasedAt in descending order (newest first)
  const allSets = useMemo(() => {
    if (!setsResponse?.data?.sets) return [];
    
    return [...setsResponse.data.sets].sort((a, b) => {
      const dateA = a.releasedAt ? new Date(a.releasedAt).getTime() : 0;
      const dateB = b.releasedAt ? new Date(b.releasedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [setsResponse]);

  // Convert sets to options for the autocomplete
  const mappedSets: Option[] = allSets.map((set) => ({
    // Use a single category for all sets to avoid grouping
    category: 'Sets',
    label: `${set.name} (${set.code})`,
    value: set.id.toString(),
    exclude: false,
  }));

  // Convert selectedSets from Redux to Option[] format
  const selectedOptions = selectedSets
    ? [
        ...selectedSets.include.map((setId) => {
          const set = allSets.find((s) => s.id.toString() === setId);
          return {
            category: 'Sets',
            label: set ? `${set.name} (${set.code})` : `Set ID: ${setId}`,
            value: setId,
            exclude: false,
          };
        }),
        ...selectedSets.exclude.map((setId) => {
          const set = allSets.find((s) => s.id.toString() === setId);
          return {
            category: 'Sets',
            label: set ? `${set.name} (${set.code})` : `Set ID: ${setId}`,
            value: setId,
            exclude: true,
          };
        }),
      ]
    : [];

  const handleSetChange = (newSelectedSets: Option[]) => {
    // Convert Option[] back to SetFilter format for Redux
    const setFilter = {
      include: newSelectedSets.filter((set) => !set.exclude).map((set) => set.value),
      exclude: newSelectedSets.filter((set) => set.exclude).map((set) => set.value),
    };

    dispatch(setSets(setFilter));
  };

  if (isLoading) {
    return <div style={{ paddingLeft: '9px' }}>Loading sets...</div>;
  }

  return (
    <AutocompleteWithNegation
      label="Sets"
      options={mappedSets}
      selectedOptions={selectedOptions}
      setSelectedOptionsRemotely={handleSetChange}
    />
  );
};

export default SetSelector;
