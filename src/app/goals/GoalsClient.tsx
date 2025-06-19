'use client';

import { Add as AddIcon } from '@mui/icons-material';
import { Alert, Box, Button, Paper, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useGetUserGoalsQuery } from '@/api/goals/goalsApi';
import { GoalsList } from '@/components/goals/GoalsList';
import Pagination, { PaginationProps } from '@/components/pagination/Pagination';
import { useAuth } from '@/hooks/useAuth';
import { useGoalsPagination } from '@/hooks/goals/useGoalsPagination';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PriceType } from '@/types/pricing';

export function GoalsClient() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [displayPriceType] = useLocalStorage<PriceType>('displayPriceType', PriceType.Market);
  const { currentPage, pageSize, onPageChange, onPageSizeChange } = useGoalsPagination();

  const queryArgs = {
    userId: user?.userId ?? 0,
    includeProgress: true,
    priceType: displayPriceType.toLowerCase(),
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  };

  const { data, isLoading, error } = useGetUserGoalsQuery(queryArgs, {
    skip: !user?.userId,
  });

  const goals = data?.data?.goals || [];
  const totalCount = data?.data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const paginationProps: PaginationProps = {
    contentType: 'cards', // Goals use card-like display
    currentPage,
    pageSize,
    pageSizeOptions: [1, 2, 3, 4, 5, 6, 7, 8, 9], // Limit to 1-9 for goals
    totalPages,
    totalItems: totalCount,
    onPageChange,
    onPageSizeChange,
    viewMode: 'grid', // Goals only support grid view
    onViewModeChange: () => {}, // No-op since goals only have grid view
    isLoading,
    hideContentTypeToggle: true, // Hide the cards/sets toggle
    hideViewModeToggle: true, // Hide the grid/table toggle
    customItemName: 'goals', // Show 'goals' instead of 'cards'
  };

  const handleCreateClick = () => {
    router.push('/goals/create');
  };

  if (isAuthLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Box p={3}>
        <Alert severity="info">Please log in to view and manage your collection goals.</Alert>
      </Box>
    );
  }

  return (
    <Box p={0}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" color="primary">
          Goals
        </Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleCreateClick}>
          Create Goal
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load goals. Please try again later.
        </Alert>
      )}

      {goals.length === 0 && !isLoading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No goals yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create your first collection goal to start tracking your progress.
          </Typography>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleCreateClick}>
            Create Your First Goal
          </Button>
        </Paper>
      )}

      {totalCount > 0 && (
        <>
          <Pagination {...paginationProps} />
          <GoalsList goals={goals} userId={user?.userId || 0} />
          <Pagination {...paginationProps} position="bottom" />
        </>
      )}
    </Box>
  );
}
