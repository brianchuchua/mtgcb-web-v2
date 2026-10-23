import SortIcon from '@mui/icons-material/Sort';
import { Button, Tooltip } from '@mui/material';
import { TOOLBAR_BUTTON_HEIGHT, TOOLBAR_ICON_BUTTON_WIDTH } from './toolbarButtonSize';

// Same outlined button as Grid / Table / Share, so the row lines up at every width.
const SortToggleButton = ({ compact, isOpen, onClick }: SortToggleButtonProps) => (
  <Tooltip title={isOpen ? 'Hide sort options' : 'Show sort options'}>
    <Button
      size="small"
      variant="outlined"
      onClick={onClick}
      startIcon={compact ? undefined : <SortIcon />}
      sx={compact ? { height: TOOLBAR_BUTTON_HEIGHT, minWidth: TOOLBAR_ICON_BUTTON_WIDTH, px: 1 } : { height: TOOLBAR_BUTTON_HEIGHT }}
    >
      {compact ? <SortIcon /> : 'Sort'}
    </Button>
  </Tooltip>
);

interface SortToggleButtonProps {
  compact: boolean;
  isOpen: boolean;
  onClick: () => void;
}

export default SortToggleButton;
