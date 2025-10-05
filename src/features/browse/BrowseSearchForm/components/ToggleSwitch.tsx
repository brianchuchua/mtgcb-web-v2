import React from 'react';
import { Box, FormControlLabel, IconButton, Paper, Popover, Switch, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  label: string;
  tooltip?: React.ReactNode;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, name, label, tooltip }) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const handleInfoClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleInfoClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          borderColor: (theme) => theme.palette.grey[700],
          mt: 1.5,
          padding: '8px 8px 8px 1px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <FormControlLabel
          sx={{ margin: 0 }}
          control={
            <Switch
              checked={checked}
              onChange={onChange}
              name={name}
              color="primary"
              size="small"
              sx={{ marginRight: '3px' }}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {label}
              {tooltip && (
                <IconButton
                  size="small"
                  onClick={handleInfoClick}
                  sx={{
                    ml: 0.5,
                    padding: 0,
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: 'primary.main',
                    },
                  }}
                >
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          }
        />
      </Paper>

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
            {tooltip}
          </Typography>
        </Box>
      </Popover>
    </>
  );
};

export default ToggleSwitch;