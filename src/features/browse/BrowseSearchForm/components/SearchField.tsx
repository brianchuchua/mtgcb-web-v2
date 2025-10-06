import React, { forwardRef } from 'react';
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

const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(({
  label,
  value,
  onChange,
  placeholder,
  startAdornment = <SearchIcon color="disabled" />,
  inputTestId,
  iconTestId,
  autoFocus = false,
}, ref) => {
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
      inputRef={ref}
      type="search"
      autoComplete="off"
      slotProps={{
        input: {
          startAdornment: <InputAdornment position="start">{adornmentWithTestId}</InputAdornment>,
        },
        htmlInput: {
          maxLength: 2000,
          spellCheck: 'false',
          autoCapitalize: 'off',
          autoCorrect: 'off',
          inputMode: 'search',
          enterKeyHint: 'search',
        },
      }}
    />
  );
});

SearchField.displayName = 'SearchField';

export default SearchField;