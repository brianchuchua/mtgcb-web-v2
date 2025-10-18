'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetCardTypesQuery } from '@/api/cards/cardsApi';
import AutocompleteWithNegation, { Option } from '@/components/ui/AutocompleteWithNegation';
import { selectTypes, setTypes } from '@/redux/slices/browse';

const TypeSelector = () => {
  const dispatch = useDispatch();
  const { data: cardTypes, isLoading, error } = useGetCardTypesQuery();
  const [mappedTypes, setMappedTypes] = useState<Option[]>([]);
  const selectedTypes = useSelector(selectTypes);

  useEffect(() => {
    if (cardTypes) {
      const allTypes: Option[] = [
        ...cardTypes.cardTypes.map((type) => ({
          category: 'Card Types',
          label: type,
          value: type,
          exclude: false,
        })),
        ...cardTypes.superTypes.map((type) => ({
          category: 'Supertypes',
          label: type,
          value: type,
          exclude: false,
        })),
        ...cardTypes.artifactTypes.map((type) => ({
          category: 'Artifact Types',
          label: type,
          value: type,
          exclude: false,
        })),
        ...cardTypes.enchantmentTypes.map((type) => ({
          category: 'Enchantment Types',
          label: type,
          value: type,
          exclude: false,
        })),
        ...cardTypes.landTypes.map((type) => ({
          category: 'Land Types',
          label: type,
          value: type,
          exclude: false,
        })),
        ...cardTypes.spellTypes.map((type) => ({
          category: 'Spell Types',
          label: type,
          value: type,
          exclude: false,
        })),
        ...cardTypes.creatureTypes.map((type) => ({
          category: 'Creature Types',
          label: type,
          value: type,
          exclude: false,
        })),
        ...cardTypes.planarTypes.map((type) => ({
          category: 'Planar Types',
          label: type,
          value: type,
          exclude: false,
        })),
        ...cardTypes.planeswalkerTypes.map((type) => ({
          category: 'Planeswalker Types',
          label: type,
          value: type,
          exclude: false,
        })),
      ];

      setMappedTypes(allTypes);
    }
  }, [cardTypes]);

  // Convert selectedTypes from Redux to Option[] format
  const selectedOptions = selectedTypes
    ? [
        ...selectedTypes.include.map((type) => ({
          category: mappedTypes.find((t) => t.value === type.replace(/"/g, ''))?.category || 'Unknown',
          label: type.replace(/"/g, ''),
          value: type.replace(/"/g, ''),
          exclude: false,
        })),
        ...selectedTypes.exclude.map((type) => ({
          category: mappedTypes.find((t) => t.value === type.replace(/"/g, ''))?.category || 'Unknown',
          label: type.replace(/"/g, ''),
          value: type.replace(/"/g, ''),
          exclude: true,
        })),
      ]
    : [];

  const handleTypeChange = (selectedTypes: Option[]) => {
    // Convert Option[] back to TypeFilter format for Redux
    const typeFilter = {
      include: selectedTypes.filter((type) => !type.exclude).map((type) => `"${type.value}"`),
      exclude: selectedTypes.filter((type) => type.exclude).map((type) => `"${type.value}"`),
    };

    dispatch(setTypes(typeFilter));
  };

  if (isLoading) {
    return null;
  }

  if (error) {
    return null;
  }

  return (
    <>
      <AutocompleteWithNegation
        label="Card Types"
        options={mappedTypes}
        selectedOptions={selectedOptions}
        setSelectedOptionsRemotely={handleTypeChange}
      />
    </>
  );
};

export default TypeSelector;
