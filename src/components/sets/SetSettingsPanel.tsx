'use client';

import SettingsIcon from '@mui/icons-material/Settings';
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  SelectChangeEvent,
  Slider,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { CardSettingGroup } from '@/components/cards/CardSettingsPanel';

// Using same types as card settings panel for consistency
export interface SetSettingsPanelProps {
  settingGroups: CardSettingGroup[];
  panelId: string;
  panelTitle: string;
}

/**
 * Panel for configuring set display settings
 */
export const SetSettingsPanel: React.FC<SetSettingsPanelProps> = ({ settingGroups, panelId, panelTitle }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? panelId : undefined;

  return (
    <>
      <Button startIcon={<SettingsIcon />} variant="outlined" size="small" aria-describedby={id} onClick={handleClick}>
        Settings
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 300,
            p: 2,
            mt: 0.5,
          },
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          {panelTitle}
        </Typography>

        {settingGroups.map((group, groupIndex) => (
          <React.Fragment key={group.label || `group-${groupIndex}`}>
            {/* Group heading */}
            {group.label && (
              <Typography variant="subtitle1" fontWeight="medium" sx={{ mt: groupIndex > 0 ? 2 : 0 }}>
                {group.label}
              </Typography>
            )}

            {/* Toggle settings */}
            {group.type === 'toggle' && (
              <FormGroup sx={{ mt: 1 }}>
                {group.settings.map((setting) => {
                  if (setting.type !== 'toggle') return null;
                  return (
                    <FormControlLabel
                      key={setting.key}
                      control={
                        <Switch
                          size="small"
                          checked={setting.isVisible}
                          onChange={(e) => setting.setVisibility(e.target.checked)}
                        />
                      }
                      label={setting.label}
                    />
                  );
                })}
              </FormGroup>
            )}

            {/* Select settings */}
            {group.type === 'select' && (
              <Stack spacing={2} sx={{ mt: 1.5, mb: 1 }}>
                {group.settings.map((setting) => {
                  if (setting.type !== 'select') return null;
                  return (
                    <FormControl key={setting.key} size="small" fullWidth>
                      {setting.label && <InputLabel>{setting.label}</InputLabel>}
                      <Select
                        value={setting.value}
                        label={setting.label}
                        onChange={(e: SelectChangeEvent<number>) => {
                          setting.setValue(Number(e.target.value));
                        }}
                      >
                        {setting.options.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  );
                })}
              </Stack>
            )}

            {/* Slider settings */}
            {group.type === 'slider' && (
              <Stack spacing={2} sx={{ mt: 2, mb: 1 }}>
                {group.settings.map((setting) => {
                  if (setting.type !== 'slider') return null;
                  return (
                    <Box key={setting.key}>
                      {setting.label && (
                        <Typography variant="body2" color="text.secondary">
                          {setting.label}
                        </Typography>
                      )}
                      <Slider
                        size="small"
                        min={setting.min}
                        max={setting.max}
                        step={setting.step}
                        valueLabelDisplay="auto"
                        value={setting.value}
                        onChange={(_e, value) => {
                          setting.setValue(value as number);
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            )}

            {/* Add divider between groups */}
            {groupIndex < settingGroups.length - 1 && <Divider sx={{ mt: 2 }} />}
          </React.Fragment>
        ))}
      </Popover>
    </>
  );
};

export default SetSettingsPanel;
