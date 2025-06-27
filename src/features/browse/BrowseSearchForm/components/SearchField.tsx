import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  startAdornment?: React.ReactNode;
}

const SearchField: React.FC<SearchFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  startAdornment = <SearchIcon color="disabled" />,
}) => {
  return (
    <TextField
      fullWidth
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      margin="dense"
      slotProps={{
        input: {
          startAdornment: <InputAdornment position="start">{startAdornment}</InputAdornment>,
        },
      }}
    />
  );
};

export default SearchField;