'use client';

import { LinearProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useGetSetTypesQuery } from '@/api/browse/browseApi';
import AutocompleteWithNegation, { Option } from '@/components/ui/AutocompleteWithNegation';
import { selectSetTypes, setSetTypes } from '@/redux/slices/browse';

const SetTypeSelector = () => {
  const dispatch = useDispatch();
  const selectedSetTypes = useSelector(selectSetTypes);
  const { data: setTypesData, isLoading, error } = useGetSetTypesQuery();

  const mappedSetTypes: Option[] = setTypesData?.data
    ? setTypesData.data.map((type) => ({
        category: 'Set Types',
        label: type.label,
        value: type.value,
        exclude: false,
      }))
    : [];

  const selectedOptions = selectedSetTypes
    ? [
        ...selectedSetTypes.include.map((typeValue) => {
          const matchingType = setTypesData?.data?.find((t) => t.value === typeValue);
          return {
            category: 'Set Types',
            label: matchingType?.label || typeValue,
            value: typeValue,
            exclude: false,
          };
        }),
        ...selectedSetTypes.exclude.map((typeValue) => {
          const matchingType = setTypesData?.data?.find((t) => t.value === typeValue);
          return {
            category: 'Set Types',
            label: matchingType?.label || typeValue,
            value: typeValue,
            exclude: true,
          };
        }),
      ]
    : [];

  const handleSetTypeChange = (selectedTypes: Option[]) => {
    const typeFilter = {
      include: selectedTypes.filter((type) => !type.exclude).map((type) => type.value),
      exclude: selectedTypes.filter((type) => type.exclude).map((type) => type.value),
    };

    dispatch(setSetTypes(typeFilter));
  };

  if (isLoading) {
    return <LinearProgress sx={{ marginY: 2 }} />;
  }

  if (error) {
    return <div>Error loading set types</div>;
  }

  return (
    <AutocompleteWithNegation
      label="Set Types"
      options={mappedSetTypes}
      selectedOptions={selectedOptions}
      setSelectedOptionsRemotely={handleSetTypeChange}
    />
  );
};

export default SetTypeSelector;
