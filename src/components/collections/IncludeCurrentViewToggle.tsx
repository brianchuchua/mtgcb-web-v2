import { Box, FormControlLabel, Switch, Typography } from '@mui/material';

export const IncludeCurrentViewToggle = ({ checked, onChange }: IncludeCurrentViewToggleProps) => (
  <Box sx={{ mb: 3 }}>
    <FormControlLabel
      control={<Switch checked={checked} onChange={(e) => onChange(e.target.checked)} size="small" />}
      label={
        <Box>
          <Typography variant="body2">Include current view</Typography>
          <Typography variant="caption" color="text.secondary">
            Share with your current filters, search, and settings
          </Typography>
        </Box>
      }
    />
  </Box>
);

interface IncludeCurrentViewToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}
