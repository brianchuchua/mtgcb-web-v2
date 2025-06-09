import { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  IconButton, 
  Chip, 
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { Goal } from '@/api/goals/types';
import { useDeleteGoalMutation } from '@/api/goals/goalsApi';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/dateUtils';
import { EditGoalDialog } from './EditGoalDialog';
import { GoalDescription } from './GoalDescription';

interface GoalsListProps {
  goals: Goal[];
  userId: number;
}

export function GoalsList({ goals, userId }: GoalsListProps) {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [deleteGoal] = useDeleteGoalMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

  const isOwner = user?.userId === userId;

  const handleDeleteClick = (goal: Goal) => {
    setGoalToDelete(goal);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!goalToDelete) return;

    try {
      await deleteGoal({ userId, goalId: goalToDelete.id }).unwrap();
      enqueueSnackbar('Goal deleted successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to delete goal', { variant: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setGoalToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setGoalToDelete(null);
  };

  const handleEditClick = (goal: Goal) => {
    setGoalToEdit(goal);
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setGoalToEdit(null);
  };


  return (
    <>
      <Grid container spacing={2}>
        {goals.map((goal) => (
          <Grid item xs={12} md={6} lg={4} key={goal.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Typography variant="h6" component="h2" sx={{ flex: 1 }}>
                    {goal.name}
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="View details">
                      <IconButton size="small">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {isOwner && (
                      <>
                        <Tooltip title="Edit goal">
                          <IconButton 
                            size="small"
                            onClick={() => handleEditClick(goal)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete goal">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteClick(goal)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Stack>
                </Box>

                {goal.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {goal.description}
                  </Typography>
                )}

                <Stack spacing={1}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Collection Goal
                    </Typography>
                    <GoalDescription 
                      goal={goal}
                      variant="body2" 
                      sx={{ 
                        fontStyle: 'italic',
                        color: 'text.primary',
                      }}
                    />
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip
                      size="small"
                      icon={goal.isActive ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                      label={goal.isActive ? 'Active' : 'Inactive'}
                      color={goal.isActive ? 'success' : 'default'}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Created {formatDate(goal.createdAt)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete Goal</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{goalToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <EditGoalDialog
        open={editDialogOpen}
        onClose={handleEditClose}
        goal={goalToEdit}
        userId={userId}
      />
    </>
  );
}