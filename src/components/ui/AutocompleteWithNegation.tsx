import { Autocomplete, Chip, TextField, Tooltip } from '@mui/material';
import { useState } from 'react';

export interface Option {
  category: string;
  label: string;
  value: string;
  exclude: boolean;
}

interface AutocompleteWithNegationProps {
  label: string;
  options: Option[];
  selectedOptions: Option[];
  setSelectedOptionsRemotely: (options: Option[]) => void;
}

const AutocompleteWithNegation = ({
  label,
  options,
  selectedOptions,
  setSelectedOptionsRemotely,
}: AutocompleteWithNegationProps) => {
  const handleChange = (event: React.SyntheticEvent, newValues: Option[]) => {
    setSelectedOptionsRemotely(newValues);
  };

  const handleChipClick = (e: React.MouseEvent, option: Option, index: number) => {
    e.preventDefault(); // Prevent the default delete behavior
    e.stopPropagation(); // Prevent the Autocomplete from opening

    // Toggle the exclude property for the clicked option
    const updatedOptions = selectedOptions.map((opt, i) =>
      i === index ? { ...opt, exclude: !opt.exclude } : opt,
    );

    setSelectedOptionsRemotely(updatedOptions);
  };

  return (
    <Autocomplete
      multiple
      options={options}
      value={selectedOptions}
      onChange={handleChange}
      groupBy={(option) => option.category}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, value) =>
        option.value === value.value && option.exclude === value.exclude
      }
      renderInput={(params) => <TextField {...params} label={label} />}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => {
          const props = getTagProps({ index });

          return (
            <Tooltip
              key={option.value}
              title={
                option.exclude ? '(Click to include this option)' : '(Click to exclude this option)'
              }
            >
              <Chip
                {...props}
                key={`${option.value}-${option.exclude}`}
                label={`${option.exclude ? 'NOT ' : ''}${option.label}`}
                color={option.exclude ? 'error' : 'default'}
                onClick={(e) => handleChipClick(e, option, index)}
                sx={{ cursor: 'pointer' }}
              />
            </Tooltip>
          );
        })
      }
      renderGroup={(params) => (
        <div key={params.key}>
          <div style={{ padding: '8px', fontWeight: 500 }}>{params.group}</div>
          {params.children}
        </div>
      )}
      filterOptions={(options, { inputValue }) => {
        return options.filter((option) =>
          option.label.toLowerCase().includes(inputValue.toLowerCase()),
        );
      }}
      sx={{
        '& .MuiAutocomplete-tag': {
          margin: '2px',
        },
      }}
    />
  );
};

export default AutocompleteWithNegation;
