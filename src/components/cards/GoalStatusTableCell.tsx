import { Box, Typography } from '@mui/material';
import { CardModel } from '@/api/browse/types';
import { GoalContributionsPopover } from './GoalContributionsPopover';

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
    // Special case: If only targetQuantityAll exists (no reg/foil targets)
    // Show the "all" message on both regular and foil columns
    if (goalTargetQuantityAll && !goalTargetQuantityReg && !goalTargetQuantityFoil) {
      return goalAllMet ? 'Goal met!' : `Need ${goalAllNeeded || 0} (either)`;
    }

    if (goalType === 'regular' && goalTargetQuantityReg) {
      return goalRegMet ? 'Goal met!' : `Need ${goalRegNeeded || 0}`;
    }

    if (goalType === 'foil' && goalTargetQuantityFoil) {
      return goalFoilMet ? 'Goal met!' : `Need ${goalFoilNeeded || 0}`;
    }

    return '\u00A0'; // Non-breaking space to maintain height
  };

  const message = getGoalMessage();
  const isGoalMet =
    // Special case: If only targetQuantityAll exists (no reg/foil targets)
    // Check goalAllMet regardless of goalType since it appears in both columns
    (goalTargetQuantityAll && !goalTargetQuantityReg && !goalTargetQuantityFoil) 
      ? goalAllMet
      : (goalType === 'regular' && goalRegMet) ||
        (goalType === 'foil' && goalFoilMet) ||
        (goalType === 'all' && goalAllMet);

  // Filter out self-contributions (same card ID)
  const otherContributingVersions = goalContributingVersions?.filter((version) => version.cardId !== card.id) || [];

  // Show asterisk logic:
  // - For both "Goal met!" and "Need X": show when there are contributing versions from OTHER cards
  const showAsterisk = otherContributingVersions.length > 0;

  const hasContributingVersions = showAsterisk;
  const showMessage = message !== '\u00A0';

  // If there are contributing versions, show with info icon
  if (hasContributingVersions && showMessage) {
    return (
      <GoalContributionsPopover
        contributingVersions={otherContributingVersions}
        isGoalMet={isGoalMet}
        justifyContent="center"
        marginTop={0.5}
      >
        <Typography
          variant="caption"
          sx={{
            color: isGoalMet ? 'success.main' : 'warning.main',
            fontWeight: 'medium',
            minHeight: '16px',
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
        color: showMessage ? (isGoalMet ? 'success.main' : 'warning.main') : 'transparent',
        fontWeight: 'medium',
        mt: 0.5,
        minHeight: '16px',
        textAlign: 'center',
      }}
    >
      {message}
    </Typography>
  );
}
