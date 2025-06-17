import { useState, useEffect } from 'react';
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
import Link from 'next/link';
import { Goal } from '@/api/goals/types';
import { useDeleteGoalMutation } from '@/api/goals/goalsApi';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/dateUtils';
import { EditGoalDialog } from './EditGoalDialog';
import { GoalDescription } from './GoalDescription';
import { CollectionProgressBar } from '@/components/collections/CollectionProgressBar';

interface GoalsListProps {
  goals: Goal[];
  userId: number;
  initialEditGoalId?: number | null;
  onEditComplete?: () => void;
}

export function GoalsList({ goals, userId, initialEditGoalId, onEditComplete }: GoalsListProps) {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [deleteGoal] = useDeleteGoalMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

  const isOwner = user?.userId === userId;

  // Handle initial edit goal from URL parameter
  useEffect(() => {
    if (initialEditGoalId && goals.length > 0) {
      const goalToEdit = goals.find(g => g.id === initialEditGoalId);
      if (goalToEdit) {
        setGoalToEdit(goalToEdit);
        setEditDialogOpen(true);
      }
    }
  }, [initialEditGoalId, goals]);

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
    onEditComplete?.();
  };


  return (
    <>
      <Grid container spacing={2}>
        {goals.map((goal) => (
          <Grid item xs={12} md={6} lg={4} key={goal.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ '&:last-child': { pb: 2 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Typography variant="h6" component="h2" sx={{ flex: 1 }}>
                    {goal.name}
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="View this goal">
                      <Link href={`/collections/${userId}?contentType=cards&goalId=${goal.id}`} passHref legacyBehavior>
                        <IconButton size="small" component="a">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Link>
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

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {goal.description || 'No description provided'}
                </Typography>

                <Stack spacing={1} sx={{ mt: 'auto' }}>
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

                  {goal.progress && (
                    <Box>
                      <Stack spacing={0.5}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            Progress
                          </Typography>
                          <Typography variant="caption" color="text.primary" fontWeight="medium">
                            {goal.progress.collectedCards} / {goal.progress.totalCards} cards
                          </Typography>
                        </Box>
                        <CollectionProgressBar 
                          percentage={goal.progress.percentageCollected}
                          height={20}
                          showLabel={true}
                          labelFormat="short"
                        />
                        <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Collection Value
                            </Typography>
                            <Typography variant="body2" color="text.primary" fontWeight="medium">
                              ${goal.progress.totalValue.toFixed(2)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Cost to Complete
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color={goal.progress.costToComplete === 0 ? 'success.main' : 'text.primary'}
                              fontWeight="medium"
                            >
                              ${goal.progress.costToComplete.toFixed(2)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Stack>
                    </Box>
                  )}

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip
                      size="small"
                      icon={goal.isActive ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                      label={goal.isActive ? 'Active' : 'Inactive'}
                      color={goal.isActive ? 'success' : 'default'}
                    />
                    {goal.updatedAt && goal.updatedAt !== goal.createdAt ? (
                      <Tooltip title={`Created ${formatDate(goal.createdAt)}`} placement="top">
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            cursor: 'help'
                          }}
                        >
                          Edited {formatDate(goal.updatedAt)}
                        </Typography>
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Created {formatDate(goal.createdAt)}
                      </Typography>
                    )}
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