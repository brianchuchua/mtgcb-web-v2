import React from 'react';
import { FormControl, InputAdornment, InputLabel, MenuItem, Select, SelectChangeEvent, Stack } from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import { SortByOption, SortOrderOption } from '@/types/browse';

interface SortControlsProps {
  sortBy: SortByOption;
  sortOrder: SortOrderOption;
  onSortByChange: (e: SelectChangeEvent<SortByOption>) => void;
  onSortOrderChange: (e: SelectChangeEvent<SortOrderOption>) => void;
  sortOptions: React.ReactNode[];
}

const SortControls: React.FC<SortControlsProps> = ({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  sortOptions,
}) => {
  return (
    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
      <FormControl size="small" sx={{ width: '65%' }}>
        <InputLabel id="sort-by-label">Sort By</InputLabel>
        <Select
          labelId="sort-by-label"
          value={sortBy}
          label="Sort By"
          onChange={onSortByChange}
          startAdornment={
            <InputAdornment position="start">
              <SortIcon color="disabled" />
            </InputAdornment>
          }
        >
          {sortOptions}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ width: '35%' }}>
        <InputLabel id="sort-order-label">Order</InputLabel>
        <Select labelId="sort-order-label" value={sortOrder} label="Order" onChange={onSortOrderChange}>
          <MenuItem value="asc">ASC</MenuItem>
          <MenuItem value="desc">DESC</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
};

export default SortControls;