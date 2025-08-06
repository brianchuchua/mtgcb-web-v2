import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  startAdornment?: React.ReactNode;
  inputTestId?: string;
  iconTestId?: string;
  autoFocus?: boolean;
}

const SearchField: React.FC<SearchFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  startAdornment = <SearchIcon color="disabled" />,
  inputTestId,
  iconTestId,
  autoFocus = false,
}) => {
  const adornmentWithTestId = iconTestId ? (
    <SearchIcon color="disabled" data-testid={iconTestId} />
  ) : (
    startAdornment
  );

  return (
    <TextField
      fullWidth
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      margin="dense"
      data-testid={inputTestId}
      autoFocus={autoFocus}
      slotProps={{
        input: {
          startAdornment: <InputAdornment position="start">{adornmentWithTestId}</InputAdornment>,
        },
      }}
    />
  );
};

export default SearchField;