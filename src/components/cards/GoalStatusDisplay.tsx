import { Box, Tooltip, Typography } from '@mui/material';
import { CardModel } from '@/api/browse/types';

interface GoalStatusDisplayProps {
  card: Partial<CardModel> & {
    id: string;
    name: string;
    quantityReg?: number;
    quantityFoil?: number;
    goalTargetQuantityReg?: number;
    goalTargetQuantityFoil?: number;
    goalTargetQuantityAll?: number | null;
    goalRegNeeded?: number;
    goalFoilNeeded?: number;
    goalAllNeeded?: number;
    goalFullyMet?: boolean;
    goalMetByOtherSets?: boolean;
    goalContributingVersions?: {
      cardId: string;
      setId: string;
      setName?: string;
      quantityReg: number;
      quantityFoil: number;
    }[];
  };
}

export function GoalStatusDisplay({ card }: GoalStatusDisplayProps) {
  const {
    goalTargetQuantityReg,
    goalTargetQuantityFoil,
    goalTargetQuantityAll,
    goalRegNeeded,
    goalFoilNeeded,
    goalAllNeeded,
    goalFullyMet,
    goalMetByOtherSets,
    goalContributingVersions,
  } = card;

  // Determine the goal status message
  const getGoalMessage = () => {
    // If goal is fully met
    if (goalFullyMet) {
      return '(Goal met!)';
    }

    // If only regular target exists
    if (goalTargetQuantityReg && !goalTargetQuantityFoil && !goalTargetQuantityAll) {
      return `(Need ${goalRegNeeded} regular)`;
    }

    // If only foil target exists
    if (!goalTargetQuantityReg && goalTargetQuantityFoil && !goalTargetQuantityAll) {
      return `(Need ${goalFoilNeeded} foil)`;
    }

    // If both regular and foil targets exist
    if (goalTargetQuantityReg && goalTargetQuantityFoil && !goalTargetQuantityAll) {
      const needs = [];
      if (goalRegNeeded && goalRegNeeded > 0) needs.push(`${goalRegNeeded} regular`);
      if (goalFoilNeeded && goalFoilNeeded > 0) needs.push(`${goalFoilNeeded} foil`);
      return needs.length > 0 ? `(Need ${needs.join(' and ')})` : '(Goal met!)';
    }

    // If "any type" target exists (goalTargetQuantityAll)
    if (goalTargetQuantityAll) {
      if (goalAllNeeded && goalAllNeeded > 0) {
        return `(Need ${goalAllNeeded} regular or foil)`;
      }
      return '(Goal met!)';
    }

    return '';
  };

  const message = getGoalMessage();
  const isGoalMet = goalFullyMet || message === '(Goal met!)';

  // Filter out self-contributions (same card ID)
  const otherContributingVersions = goalContributingVersions?.filter((version) => version.cardId !== card.id) || [];

  // Show asterisk logic:
  // - For both "Goal met!" and "Need X": show when there are contributing versions from OTHER cards
  const showAsterisk = otherContributingVersions.length > 0;

  const hasContributingVersions = showAsterisk;

  // Render tooltip content
  const renderTooltipContent = () => {
    // Always use filtered list to exclude self-contributions
    const versionsToShow = otherContributingVersions;

    if (!versionsToShow || versionsToShow.length === 0) return null;

    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          {isGoalMet ? 'Goal met by cards from:' : 'Progress from other sets:'}
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

  if (!message) return null;

  // If there are contributing versions, wrap in tooltip
  if (hasContributingVersions) {
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
            textAlign: 'center',
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
        color: isGoalMet ? 'success.main' : 'warning.main',
        fontWeight: 'medium',
        textAlign: 'center',
      }}
    >
      {message}
    </Typography>
  );
}
