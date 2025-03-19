'use client';

import SettingsIcon from '@mui/icons-material/Settings';
import {
  Box,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  Paper,
  Popover,
  Switch,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import React, { useState } from 'react';

export interface CardSetting {
  key: string;
  label: string;
  isVisible: boolean;
  setVisibility: (isVisible: boolean) => void;
}

export interface CardSettingGroup {
  label: string;
  settings: CardSetting[];
  type: string;
}

interface CardSettingsPanelProps {
  settingGroups: CardSettingGroup[];
  panelId: string;
}

const CardSettingsPanel: React.FC<CardSettingsPanelProps> = ({ settingGroups, panelId }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const theme = useTheme();

  const handleSettingsButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseSettingsMenu = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Display Settings">
        <IconButton
          size="small"
          aria-controls={open ? panelId : undefined}
          aria-haspopup="true"
          onClick={handleSettingsButtonClick}
          sx={{
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              transform: 'rotate(30deg)',
            },
          }}
        >
          <SettingsIcon color="action" />
        </IconButton>
      </Tooltip>
      <Popover
        id={panelId}
        open={open}
        anchorEl={anchorEl}
        onClose={handleCloseSettingsMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        elevation={3}
        sx={{
          '& .MuiPaper-root': {
            overflow: 'visible',
            borderRadius: 2,
            boxShadow: `0 6px 16px 0 ${alpha(theme.palette.common.black, 0.12)}`,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: -10,
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: 20,
              height: 20,
              backgroundColor: theme.palette.background.paper,
              zIndex: 0,
            },
          },
        }}
      >
        <SettingsPanelContent>
          <SettingsHeader>
            <Typography variant="subtitle1" fontWeight={600} color="primary">
              Card Display Settings
            </Typography>
          </SettingsHeader>

          <Divider sx={{ mb: 2 }} />

          <FormControl component="fieldset" sx={{ width: '100%' }}>
            {settingGroups.map((settingGroup) => (
              <FormGroup key={settingGroup.label}>
                <GroupHeader>
                  <Typography variant="body2" fontWeight={500} color="text.secondary">
                    {settingGroup.label}
                  </Typography>
                </GroupHeader>

                <SettingsGrid>
                  {settingGroup.settings.map((setting) => (
                    <FormControlLabel
                      key={setting.key}
                      control={
                        <Switch
                          color="primary"
                          size="small"
                          checked={setting.isVisible}
                          onChange={() => setting.setVisibility(!setting.isVisible)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: theme.palette.primary.main,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.5),
                            },
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontWeight: 400 }}>
                          {setting.label}
                        </Typography>
                      }
                      sx={{
                        margin: 0,
                        py: 0.75,
                        px: 1,
                        borderRadius: 1,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    />
                  ))}
                </SettingsGrid>
              </FormGroup>
            ))}
          </FormControl>
        </SettingsPanelContent>
      </Popover>
    </>
  );
};

const SettingsPanelContent = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  minWidth: '240px',
  maxWidth: '300px',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
}));

const SettingsHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
}));

const GroupHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
}));

const SettingsGrid = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  marginBottom: theme.spacing(1.5),
}));

export default CardSettingsPanel;
