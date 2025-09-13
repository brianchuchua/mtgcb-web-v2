import { Box, Typography } from '@mui/material';
import { CardModel } from '@/api/browse/types';
import { GoalContributionsPopover } from './GoalContributionsPopover';

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

  if (!message) return null;

  // If there are contributing versions, show with info icon
  if (hasContributingVersions) {
    return (
      <GoalContributionsPopover
        contributingVersions={otherContributingVersions}
        isGoalMet={isGoalMet}
        anchorOriginHorizontal="center"
        transformOriginHorizontal="center"
        justifyContent="center"
      >
        <Typography
          variant="caption"
          sx={{
            color: isGoalMet ? 'success.main' : 'warning.main',
            fontWeight: 'medium',
            display: 'inline-block',
          }}
        >
          {message}
        </Typography>
      </GoalContributionsPopover>
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
