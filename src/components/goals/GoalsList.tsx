import {
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DeleteGoalDialog } from './DeleteGoalDialog';
import { GoalDescription } from './GoalDescription';
import { Goal } from '@/api/goals/types';
import { CollectionProgressBar } from '@/components/collections/CollectionProgressBar';
import { useDeleteGoal } from '@/hooks/goals/useDeleteGoal';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/dateUtils';
import { getCollectionUrl } from '@/utils/collectionUrls';

interface GoalsListProps {
  goals: Goal[];
  userId: number;
}

export function GoalsList({ goals, userId }: GoalsListProps) {
  const { user } = useAuth();
  const router = useRouter();
  const {
    deleteDialogOpen,
    goalToDelete,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
  } = useDeleteGoal(userId);

  const isOwner = user?.userId === userId;

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
                    {goal.isActive ? (
                      <Link 
                        href={`${getCollectionUrl({ userId, contentType: 'cards', goalId: goal.id })}&oneResultPerCardName=${goal.onePrintingPerPureName ? 'true' : 'false'}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            color: 'inherit',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          {goal.name}
                        </Typography>
                      </Link>
                    ) : (
                      <Typography
                        variant="h6"
                        sx={{
                          color: 'text.secondary',
                        }}
                      >
                        {goal.name}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    {goal.isActive ? (
                      <Tooltip title="View goal">
                        <Link href={`${getCollectionUrl({ userId, contentType: 'cards', goalId: goal.id })}&oneResultPerCardName=${goal.onePrintingPerPureName ? 'true' : 'false'}`}>
                          <IconButton size="small">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Link>
                      </Tooltip>
                    ) : (
                      <Tooltip title="View goal (Inactive)">
                        <span>
                          <IconButton size="small" disabled>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
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
                  {goal.progress ? (
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
                  ) : (
                    <Box>
                      <Stack spacing={0.5}>
                        {/* Progress header with loading spinner */}
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            Progress
                          </Typography>
                          <CircularProgress size={12} thickness={5} />
                        </Box>
                        {/* Placeholder for progress bar - same height as real one */}
                        <Box sx={{ height: 20, bgcolor: 'action.hover', borderRadius: 1 }} />
                        {/* Placeholder for stats row - same layout as real stats */}
                        <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Collection Value
                            </Typography>
                            <Box sx={{ height: 20, width: 60, bgcolor: 'action.hover', borderRadius: 0.5, mt: 0.25 }} />
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Cost to Complete
                            </Typography>
                            <Box sx={{ height: 20, width: 60, bgcolor: 'action.hover', borderRadius: 0.5, mt: 0.25 }} />
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

      <DeleteGoalDialog
        open={deleteDialogOpen}
        goalName={goalToDelete?.name || ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
}
