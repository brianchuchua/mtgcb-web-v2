'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AutocompleteWithNegation, { Option } from '@/components/ui/AutocompleteWithNegation';
import { selectSets, setSets } from '@/redux/slices/browseSlice';

interface Set {
  id: number;
  name: string;
  code: string;
  category: string;
  releasedAt: string;
}

const SetSelector = () => {
  const dispatch = useDispatch();
  const selectedSets = useSelector(selectSets);
  const [allSets, setAllSets] = useState<Set[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_MTGCB_API_BASE_URL}/sets/all`);
        const data = await response.json();
        
        if (data.success && data.data.sets) {
          // Sort sets by releasedAt in descending order (newest first)
          const sortedSets = [...data.data.sets].sort((a, b) => {
            return new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime();
          });
          setAllSets(sortedSets);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sets:', error);
        setLoading(false);
      }
    };
    
    fetchSets();
  }, []);

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

  if (loading) {
    return <div>Loading sets...</div>;
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
