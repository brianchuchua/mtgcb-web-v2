import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Box,
  Button,
  Collapse,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState } from 'react';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  margin: '0 auto',
  marginTop: theme.spacing(0),
  marginBottom: theme.spacing(0),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  maxWidth: 500,
  [theme.breakpoints.down('sm')]: {
    marginTop: theme.spacing(1),
  },
}));

const QuantityContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&:focus-within': {
    '& button': {
      borderColor: theme.palette.primary.main,
    },
  },
}));

const QuantityInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-input': {
    padding: '6px 12px',
    textAlign: 'center',
    fontSize: '0.875rem',
    height: '24px',
    boxSizing: 'border-box',
  },
  '& .MuiOutlinedInput-root': {
    height: '36px',
    borderRadius: 0,
    '& fieldset': {
      borderLeft: 'none',
      borderRight: 'none',
      borderColor: theme.palette.divider,
      transition: 'border-color 0.2s',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.divider,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: 1,
    },
  },
  '& input[type="number"]::-webkit-inner-spin-button, & input[type="number"]::-webkit-outer-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  '& input[type="number"]': {
    MozAppearance: 'textfield',
  },
  width: '80px',
}));

const QuantityButton = styled(IconButton)(({ theme }) => ({
  padding: '6px',
  height: '36px',
  width: '36px',
  borderRadius: 0,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s',
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.divider,
  },
  '&.Mui-disabled': {
    borderColor: theme.palette.divider,
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1rem',
  },
}));

const QuantityLeftButton = styled(QuantityButton)(({ theme }) => ({
  borderTopLeftRadius: theme.shape.borderRadius,
  borderBottomLeftRadius: theme.shape.borderRadius,
  borderRight: 'none',
}));

const QuantityRightButton = styled(QuantityButton)(({ theme }) => ({
  borderTopRightRadius: theme.shape.borderRadius,
  borderBottomRightRadius: theme.shape.borderRadius,
  borderLeft: 'none',
}));

const FormSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(1.5),
  },
}));

export interface MassUpdateFormData {
  mode: 'set' | 'increment';
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic' | 'all';
  quantityReg: number;
  quantityFoil: number;
}

interface MassUpdatePanelProps {
  isOpen: boolean;
  onSubmit: (data: MassUpdateFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const MassUpdatePanel: React.FC<MassUpdatePanelProps> = ({ isOpen, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState<MassUpdateFormData>({
    mode: 'set',
    rarity: 'all',
    quantityReg: 0,
    quantityFoil: 0,
  });

  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, mode: event.target.value as 'set' | 'increment' });
  };

  const handleRarityChange = (event: any) => {
    setFormData({ ...formData, rarity: event.target.value });
  };

  const handleQuantityChange = (field: 'quantityReg' | 'quantityFoil', value: number) => {
    // In set mode, don't allow negative values
    if (formData.mode === 'set' && value < 0) {
      return;
    }

    setFormData({ ...formData, [field]: value });
  };

  const getRarityLabel = (rarity: string): string => {
    const labels: Record<string, string> = {
      common: 'commons',
      uncommon: 'uncommons',
      rare: 'rares',
      mythic: 'mythics',
      all: 'cards',
    };
    return labels[rarity] || rarity;
  };

  const getActionDescription = (): string => {
    const rarityLabel = getRarityLabel(formData.rarity);
    const { mode, quantityReg, quantityFoil } = formData;

    if (mode === 'set') {
      return `Set all ${rarityLabel} in this set to ${quantityReg} regular and ${quantityFoil} foil.`;
    } else {
      // Handle increment/decrement mode
      if (quantityReg === 0 && quantityFoil === 0) {
        return `No changes will be made to ${rarityLabel} in this set.`;
      }

      const parts: string[] = [];

      if (quantityReg !== 0) {
        const action = quantityReg > 0 ? 'Add' : 'Remove';
        parts.push(`${action} ${Math.abs(quantityReg)} regular`);
      }

      if (quantityFoil !== 0) {
        const action = quantityFoil > 0 ? 'add' : 'remove';
        // Capitalize if this is the first/only action
        const finalAction = parts.length === 0 ? action.charAt(0).toUpperCase() + action.slice(1) : action;
        parts.push(`${finalAction} ${Math.abs(quantityFoil)} foil`);
      }

      const combinedAction = parts.join(' and ');
      return `${combinedAction} for all ${rarityLabel} in this set.`;
    }
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const isValidForm = () => {
    if (formData.mode === 'set') {
      return formData.quantityReg >= 0 && formData.quantityFoil >= 0;
    }
    return true;
  };

  return (
    <Collapse in={isOpen}>
      <StyledPaper elevation={0}>
        <Typography variant="subtitle1" fontWeight="500" gutterBottom sx={{ textAlign: 'center' }}>
          Mass Update This Set By
        </Typography>

        <Stack spacing={1}>
          {/* Mode Selection - Compact */}
          <FormControl component="fieldset" size="small">
            <RadioGroup row value={formData.mode} onChange={handleModeChange} sx={{ justifyContent: 'center' }}>
              <FormControlLabel value="set" control={<Radio size="small" />} label="Setting" sx={{ mr: 3 }} />
              <FormControlLabel value="increment" control={<Radio size="small" />} label="Adding or Removing" />
            </RadioGroup>
          </FormControl>

          {/* Rarity and Quantities in one row on desktop, stacked on mobile */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', sm: 'flex-end' }}
            justifyContent="center"
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', textAlign: 'center', mb: 0.5 }}
              >
                For
              </Typography>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={formData.rarity}
                  onChange={handleRarityChange}
                  sx={{
                    height: '36px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.divider,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.divider,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: (theme) => theme.palette.primary.main,
                      borderWidth: 1,
                    },
                  }}
                >
                  <MenuItem value="all">All cards</MenuItem>
                  <MenuItem value="common">All commons</MenuItem>
                  <MenuItem value="uncommon">All uncommons</MenuItem>
                  <MenuItem value="rare">All rares</MenuItem>
                  <MenuItem value="mythic">All mythics</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Stack direction="row" spacing={1} justifyContent="center">
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', textAlign: 'center', mb: 0.5 }}
                >
                  Regular
                </Typography>
                <QuantityContainer>
                  <QuantityLeftButton
                    size="small"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.currentTarget.blur();
                      handleQuantityChange(
                        'quantityReg',
                        Math.max(formData.mode === 'set' ? 0 : -999, formData.quantityReg - 1),
                      );
                    }}
                    disabled={isLoading || (formData.mode === 'set' && formData.quantityReg === 0)}
                    tabIndex={-1}
                    disableFocusRipple
                  >
                    <RemoveIcon />
                  </QuantityLeftButton>
                  <QuantityInput
                    type="number"
                    value={formData.quantityReg}
                    onChange={(e) => handleQuantityChange('quantityReg', parseInt(e.target.value) || 0)}
                    inputProps={{
                      min: formData.mode === 'set' ? 0 : undefined,
                    }}
                    size="small"
                    disabled={isLoading}
                  />
                  <QuantityRightButton
                    size="small"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.currentTarget.blur();
                      handleQuantityChange('quantityReg', formData.quantityReg + 1);
                    }}
                    disabled={isLoading}
                    tabIndex={-1}
                    disableFocusRipple
                  >
                    <AddIcon />
                  </QuantityRightButton>
                </QuantityContainer>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', textAlign: 'center', mb: 0.5 }}
                >
                  Foil
                </Typography>
                <QuantityContainer>
                  <QuantityLeftButton
                    size="small"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.currentTarget.blur();
                      handleQuantityChange(
                        'quantityFoil',
                        Math.max(formData.mode === 'set' ? 0 : -999, formData.quantityFoil - 1),
                      );
                    }}
                    disabled={isLoading || (formData.mode === 'set' && formData.quantityFoil === 0)}
                    tabIndex={-1}
                    disableFocusRipple
                  >
                    <RemoveIcon />
                  </QuantityLeftButton>
                  <QuantityInput
                    type="number"
                    value={formData.quantityFoil}
                    onChange={(e) => handleQuantityChange('quantityFoil', parseInt(e.target.value) || 0)}
                    inputProps={{
                      min: formData.mode === 'set' ? 0 : undefined,
                    }}
                    size="small"
                    disabled={isLoading}
                  />
                  <QuantityRightButton
                    size="small"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.currentTarget.blur();
                      handleQuantityChange('quantityFoil', formData.quantityFoil + 1);
                    }}
                    disabled={isLoading}
                    tabIndex={-1}
                    disableFocusRipple
                  >
                    <AddIcon />
                  </QuantityRightButton>
                </QuantityContainer>
              </Box>
            </Stack>
          </Stack>

          {/* Action description */}
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              // bgcolor: 'action.hover',
              borderRadius: 1,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="textSecondary" fontWeight="medium" style={{ fontStyle: 'italic' }}>
              {getActionDescription()}
            </Typography>
          </Box>

          {/* Action buttons */}
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button variant="outlined" size="small" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleSubmit}
              disabled={!isValidForm() || isLoading}
            >
              Apply
            </Button>
          </Stack>
        </Stack>
      </StyledPaper>
    </Collapse>
  );
};

export default MassUpdatePanel;
