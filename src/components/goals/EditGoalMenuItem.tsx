'use client';

import EditIcon from '@mui/icons-material/Edit';
import { ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import { useRouter } from 'next/navigation';
import React from 'react';

export const EditGoalMenuItem: React.FC<EditGoalMenuItemProps> = ({ goalId, onClick }) => {
  const router = useRouter();

  const handleClick = () => {
    onClick?.();
    router.push(`/goals/edit/${goalId}`);
  };

  return (
    <MenuItem onClick={handleClick} data-testid="edit-goal-menu-item">
      <ListItemIcon>
        <EditIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Edit Goal</ListItemText>
    </MenuItem>
  );
};

interface EditGoalMenuItemProps {
  goalId: number;
  onClick?: () => void;
}
