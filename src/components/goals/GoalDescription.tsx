import { useMemo } from 'react';
import { Typography, TypographyProps } from '@mui/material';
import { Goal } from '@/api/goals/types';
import { formatSearchCriteria } from '@/utils/goals/formatSearchCriteria';
import { useSetNames } from '@/utils/goals/useSetNames';

interface GoalDescriptionProps extends Omit<TypographyProps, 'children'> {
  goal: Goal;
}

export function GoalDescription({ goal, ...typographyProps }: GoalDescriptionProps) {
  // Extract set IDs from the search criteria
  const setIds = useMemo(() => {
    const conditions = goal.searchCriteria.conditions;
    if (conditions.setId?.OR) {
      return conditions.setId.OR;
    }
    return undefined;
  }, [goal.searchCriteria.conditions]);

  const { setNames } = useSetNames(setIds);

  const description = useMemo(() => {
    const criteriaText = formatSearchCriteria(goal.searchCriteria);
    
    // Determine quantity text
    let quantityText = '';
    if (goal.targetQuantityAll) {
      quantityText = `${goal.targetQuantityAll}x of`;
    } else if (goal.targetQuantityReg && goal.targetQuantityFoil) {
      quantityText = `${goal.targetQuantityReg}x regular and ${goal.targetQuantityFoil}x foil of`;
    } else if (goal.targetQuantityReg) {
      quantityText = `${goal.targetQuantityReg}x regular of`;
    } else if (goal.targetQuantityFoil) {
      quantityText = `${goal.targetQuantityFoil}x foil of`;
    } else {
      quantityText = '1x of';
    }

    // Replace "from specific sets" with actual set names
    let finalText = `${quantityText} ${criteriaText}`;
    if (setIds && setIds.length > 0 && Object.keys(setNames).length > 0) {
      const setNamesList = setIds
        .map((id: string) => setNames[id])
        .filter(Boolean)
        .join(', ');
      
      if (setNamesList) {
        finalText = finalText.replace('from specific sets', `from ${setNamesList}`);
      }
    }

    return finalText;
  }, [goal, setNames, setIds]);

  return (
    <Typography {...typographyProps}>
      {description}
    </Typography>
  );
}