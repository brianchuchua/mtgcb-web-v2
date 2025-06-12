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
  const { includedSetIds, excludedSetIds } = useMemo(() => {
    const conditions = goal.searchCriteria.conditions;
    const included = conditions.setId?.OR || [];
    const excluded: string[] = [];
    
    if (conditions.setId?.AND) {
      conditions.setId.AND.forEach((condition: string) => {
        if (condition.startsWith('!=')) {
          excluded.push(condition.substring(2));
        }
      });
    }
    
    return { 
      includedSetIds: included.length > 0 ? included : undefined,
      excludedSetIds: excluded.length > 0 ? excluded : undefined
    };
  }, [goal.searchCriteria.conditions]);

  // Get names for both included and excluded sets
  const allSetIds = useMemo(() => {
    const ids = [...(includedSetIds || []), ...(excludedSetIds || [])];
    return ids.length > 0 ? ids : undefined;
  }, [includedSetIds, excludedSetIds]);
  
  const { setNames } = useSetNames(allSetIds);

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
    
    if (includedSetIds && includedSetIds.length > 0 && Object.keys(setNames).length > 0) {
      const setNamesList = includedSetIds
        .map((id: string) => setNames[id])
        .filter(Boolean)
        .join(', ');
      
      if (setNamesList) {
        finalText = finalText.replace('from specific sets', `from ${setNamesList}`);
      }
    }
    
    // Replace "excluding X sets" with actual excluded set names
    if (excludedSetIds && excludedSetIds.length > 0 && Object.keys(setNames).length > 0) {
      const excludedSetNamesList = excludedSetIds
        .map((id: string) => setNames[id])
        .filter(Boolean)
        .join(', ');
      
      if (excludedSetNamesList) {
        const excludedCount = excludedSetIds.length;
        const pattern = `excluding ${excludedCount} set${excludedCount > 1 ? 's' : ''}`;
        finalText = finalText.replace(pattern, `excluding ${excludedSetNamesList}`);
      }
    }

    return finalText;
  }, [goal, setNames, includedSetIds, excludedSetIds]);

  return (
    <Typography {...typographyProps}>
      {description}
    </Typography>
  );
}