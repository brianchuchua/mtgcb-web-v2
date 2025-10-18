'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AutocompleteWithNegation, { Option } from '@/components/ui/AutocompleteWithNegation';
import { selectRarities, setRarities } from '@/redux/slices/browse';

const RARITY_MAP = [
  { name: 'Common', value: 2 },
  { name: 'Uncommon', value: 3 },
  { name: 'Rare', value: 4 },
  { name: 'Mythic', value: 5 },
  { name: 'Special', value: 6 },
];

const RaritySelector = () => {
  const dispatch = useDispatch();
  const selectedRarities = useSelector(selectRarities);

  // Convert rarities to options
  const mappedRarities: Option[] = RARITY_MAP.map((rarity) => ({
    category: 'Rarities',
    label: rarity.name,
    value: rarity.value.toString(),
    exclude: false,
  }));

  // Convert selectedRarities from Redux to Option[] format
  const selectedOptions = selectedRarities
    ? [
        ...selectedRarities.include.map((rarityNumeric) => ({
          category: 'Rarities',
          label: RARITY_MAP.find((r) => r.value.toString() === rarityNumeric)?.name || 'Unknown',
          value: rarityNumeric,
          exclude: false,
        })),
        ...selectedRarities.exclude.map((rarityNumeric) => ({
          category: 'Rarities',
          label: RARITY_MAP.find((r) => r.value.toString() === rarityNumeric)?.name || 'Unknown',
          value: rarityNumeric,
          exclude: true,
        })),
      ]
    : [];

  const handleRarityChange = (selectedRarities: Option[]) => {
    // Convert Option[] back to RarityFilter format for Redux
    const rarityFilter = {
      include: selectedRarities.filter((rarity) => !rarity.exclude).map((rarity) => rarity.value),
      exclude: selectedRarities.filter((rarity) => rarity.exclude).map((rarity) => rarity.value),
    };

    dispatch(setRarities(rarityFilter));
  };

  return (
    <AutocompleteWithNegation
      label="Rarities"
      options={mappedRarities}
      selectedOptions={selectedOptions}
      setSelectedOptionsRemotely={handleRarityChange}
    />
  );
};

export default RaritySelector;
