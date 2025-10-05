import React from 'react';
import { TextField, InputAdornment, IconButton, Popover, Box, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import OracleTextTooltip from './OracleTextTooltip';

interface OracleTextFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const OracleTextField: React.FC<OracleTextFieldProps> = ({ value, onChange }) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const handleInfoClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleInfoClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <TextField
        fullWidth
        label="Oracle Text"
        value={value}
        onChange={onChange}
        placeholder="Search card text"
        margin="dense"
        type="search"
        autoComplete="off"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconButton
                size="small"
                onClick={handleInfoClick}
                sx={{
                  padding: 0,
                  color: 'action.disabled',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: 'primary.main',
                  },
                }}
              >
                <InfoOutlinedIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        slotProps={{
          htmlInput: {
            spellCheck: 'false',
            autoCapitalize: 'off',
            autoCorrect: 'off',
            enterKeyHint: 'search',
          },
        }}
      />

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleInfoClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="body2" component="div">
            <OracleTextTooltip />
          </Typography>
        </Box>
      </Popover>
    </>
  );
};

export default OracleTextField;