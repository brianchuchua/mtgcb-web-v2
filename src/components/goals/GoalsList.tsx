import {
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { GoalDescription } from './GoalDescription';
import { useDeleteGoalMutation } from '@/api/goals/goalsApi';
import { Goal } from '@/api/goals/types';
import { CollectionProgressBar } from '@/components/collections/CollectionProgressBar';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/dateUtils';

interface GoalsListProps {
  goals: Goal[];
  userId: number;
}

export function GoalsList({ goals, userId }: GoalsListProps) {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const [deleteGoal] = useDeleteGoalMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

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
    router.push(`/goals/edit/${goal.id}`);
  };

  return (
    <>
      <Grid container spacing={2}>
        {goals.map((goal) => (
          <Grid item xs={12} md={6} lg={4} key={goal.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ '&:last-child': { pb: 2 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {!goal.isActive && (
                      <Tooltip title="(Inactive goals won't show in the list of goals while viewing your collection.)">
                        <Chip size="small" icon={<RadioButtonUncheckedIcon />} label="Inactive" color="default" />
                      </Tooltip>
                    )}
                    <Link href={`/collections/${userId}?contentType=cards&goalId=${goal.id}&oneResultPerCardName=${goal.onePrintingPerPureName ? 'true' : 'false'}`} passHref legacyBehavior>
                      <Typography
                        variant="h6"
                        component="a"
                        sx={{
                          textDecoration: 'none',
                          color: goal.isActive ? 'inherit' : 'text.secondary',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {goal.name}
                      </Typography>
                    </Link>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <Link href={`/collections/${userId}?contentType=cards&goalId=${goal.id}&oneResultPerCardName=${goal.onePrintingPerPureName ? 'true' : 'false'}`} passHref legacyBehavior>
                      <Tooltip title="View goal">
                        <IconButton size="small" component="a">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Link>
                    {isOwner && (
                      <>
                        <Tooltip title="Edit goal">
                          <IconButton size="small" onClick={() => handleEditClick(goal)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete goal">
                          <IconButton size="small" color="error" onClick={() => handleDeleteClick(goal)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Stack>
                </Box>

                {goal.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {goal.description}
                  </Typography>
                )}

                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Goal Summary
                  </Typography>
                  <GoalDescription
                    goal={goal}
                    variant="body2"
                    sx={{
                      fontStyle: 'italic',
                      color: 'text.secondary',
                    }}
                  />
                </Box>

                <Stack spacing={1} sx={{ mt: 'auto' }}>
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
                          labelFormat="long"
                        />
                        <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Collection Value
                            </Typography>
                            <Typography variant="body2" color="success" fontWeight="medium">
                              ${goal.progress.totalValue.toFixed(2)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Cost to Complete
                            </Typography>
                            <Typography
                              variant="body2"
                              color={goal.progress.costToComplete === 0 ? 'success.main' : 'warning.main'}
                              fontWeight="medium"
                            >
                              ${goal.progress.costToComplete.toFixed(2)}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1, textAlign: 'right' }}>
                            {goal.updatedAt && goal.updatedAt !== goal.createdAt ? (
                              <Tooltip title={`Created ${formatDate(goal.createdAt)}`} placement="top">
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Edited
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ cursor: 'help' }}>
                                    {formatDate(goal.updatedAt)}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            ) : (
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Created
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(goal.createdAt)}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Stack>
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete Goal</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete "{goalToDelete?.name}"? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
