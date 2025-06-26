import { Box, Tooltip, Typography } from '@mui/material';
import { CardModel } from '@/api/browse/types';

interface GoalStatusTableCellProps {
  card: Partial<CardModel> & {
    id?: string;
    goalTargetQuantityReg?: number;
    goalTargetQuantityFoil?: number;
    goalTargetQuantityAll?: number | null;
    goalRegMet?: boolean;
    goalFoilMet?: boolean;
    goalAllMet?: boolean;
    goalRegNeeded?: number;
    goalFoilNeeded?: number;
    goalAllNeeded?: number;
    goalMetByOtherSets?: boolean;
    goalContributingVersions?: {
      cardId: string;
      setId: string;
      setName?: string;
      quantityReg: number;
      quantityFoil: number;
    }[];
  };
  goalType: 'regular' | 'foil' | 'all';
}

export function GoalStatusTableCell({ card, goalType }: GoalStatusTableCellProps) {
  const {
    goalTargetQuantityReg,
    goalTargetQuantityFoil,
    goalTargetQuantityAll,
    goalRegMet,
    goalFoilMet,
    goalAllMet,
    goalRegNeeded,
    goalFoilNeeded,
    goalAllNeeded,
    goalMetByOtherSets,
    goalContributingVersions,
  } = card;

  // Determine the goal status message
  const getGoalMessage = () => {
    if (goalType === 'regular' && goalTargetQuantityReg) {
      return goalRegMet ? 'Goal met!' : `Need ${goalRegNeeded || 0}`;
    }

    if (goalType === 'foil' && goalTargetQuantityFoil) {
      return goalFoilMet ? 'Goal met!' : `Need ${goalFoilNeeded || 0}`;
    }

    if (goalType === 'all' && goalTargetQuantityAll && !goalTargetQuantityReg && !goalTargetQuantityFoil) {
      return goalAllMet ? 'Goal met!' : `Need ${goalAllNeeded || 0} (either)`;
    }

    return '\u00A0'; // Non-breaking space to maintain height
  };

  const message = getGoalMessage();
  const isGoalMet =
    (goalType === 'regular' && goalRegMet) ||
    (goalType === 'foil' && goalFoilMet) ||
    (goalType === 'all' && goalAllMet);

  // Filter out self-contributions (same card ID)
  const otherContributingVersions = goalContributingVersions?.filter((version) => version.cardId !== card.id) || [];

  // Show asterisk logic:
  // - For both "Goal met!" and "Need X": show when there are contributing versions from OTHER cards
  const showAsterisk = otherContributingVersions.length > 0;

  const hasContributingVersions = showAsterisk;
  const showMessage = message !== '\u00A0';

  // Render tooltip content
  const renderTooltipContent = () => {
    // Always use filtered list to exclude self-contributions
    const versionsToShow = otherContributingVersions;

    if (!versionsToShow || versionsToShow.length === 0) return null;

    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Contributions from other sets:
        </Typography>
        {versionsToShow.map((version, index) => (
          <Box key={`${version.cardId}-${index}`} sx={{ mb: 0.5 }}>
            <Typography variant="body2">
              {version.setName || `Set ${version.setId}`}:{version.quantityReg > 0 && ` ${version.quantityReg} regular`}
              {version.quantityReg > 0 && version.quantityFoil > 0 && ','}
              {version.quantityFoil > 0 && ` ${version.quantityFoil} foil`}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  // If there are contributing versions, wrap in tooltip
  if (hasContributingVersions && showMessage) {
    return (
      <Tooltip
        title={renderTooltipContent()}
        placement="top"
        arrow
        enterDelay={300}
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: 3,
              border: 1,
              borderColor: 'divider',
              '& .MuiTooltip-arrow': {
                color: 'background.paper',
                '&::before': {
                  border: 1,
                  borderColor: 'divider',
                },
              },
            },
          },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: isGoalMet ? 'success.main' : 'warning.main',
            fontWeight: 'medium',
            mt: 0.5,
            minHeight: '16px',
            cursor: 'help',
          }}
        >
          {message}
          <span style={{ marginLeft: '2px' }}>*</span>
        </Typography>
      </Tooltip>
    );
  }

  // Otherwise, just display the message
  return (
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        color: showMessage ? (isGoalMet ? 'success.main' : 'warning.main') : 'transparent',
        fontWeight: 'medium',
        mt: 0.5,
        minHeight: '16px',
      }}
    >
      {message}
    </Typography>
  );
}
