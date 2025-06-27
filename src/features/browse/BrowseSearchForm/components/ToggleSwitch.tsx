import React from 'react';
import { Box, FormControlLabel, Paper, Switch, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  label: string;
  tooltip?: React.ReactNode;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, name, label, tooltip }) => {
  return (
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
              <Tooltip title={tooltip} placement="right">
                <InfoOutlinedIcon fontSize="small" sx={{ ml: 0.5, cursor: 'help', color: 'text.secondary' }} />
              </Tooltip>
            )}
          </Box>
        }
      />
    </Paper>
  );
};

export default ToggleSwitch;