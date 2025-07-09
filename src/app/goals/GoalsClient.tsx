'use client';

import { Add as AddIcon, InfoOutlined as InfoOutlinedIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useGetUserGoalsQuery } from '@/api/goals/goalsApi';
import { GoalsList } from '@/components/goals/GoalsList';
import Pagination, { PaginationProps } from '@/components/pagination/Pagination';
import { usePriceType } from '@/contexts/DisplaySettingsContext';
import { useGoalsPagination } from '@/hooks/goals/useGoalsPagination';
import { useAuth } from '@/hooks/useAuth';

export function GoalsClient() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [displayPriceType] = usePriceType();
  const { currentPage, pageSize, onPageChange, onPageSizeChange } = useGoalsPagination();
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

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
    hideSearchButton: true, // Hide the 'Open search options' button
    hideSettingsPanel: true, // Hide the gear icon
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
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => setInfoDialogOpen(true)} size="small" sx={{ color: 'text.secondary' }}>
            <InfoOutlinedIcon />
          </IconButton>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleCreateClick}>
            Create Goal
          </Button>
        </Box>
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
          <Box sx={{ mt: { xs: 2, sm: 0 } }}>
            <GoalsList goals={goals} userId={user?.userId || 0} />
          </Box>
          <Pagination {...paginationProps} position="bottom" />
        </>
      )}

      <Dialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 1,
        }}
      >
        <DialogTitle>About Goals</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            <strong>What are goals?</strong>
          </Typography>
          <Typography variant="body2" paragraph>
            Goals help you track your progress toward collecting whatever you value the most. It can be something like
            "collect every red goblin" or "collect every legendary creature cheaper than $10".
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Key features:</strong>
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
            <li>Create goals based on any search criteria (sets, colors, card types, etc.)</li>
            <li>Track progress with visual progress bars showing percentage complete</li>
            <li>See the current value of your goal and cost to complete</li>
            <li>Choose whether to collect one printing per card or all printings</li>
            <li>Set separate quantities for regular and foil cards, or a combined target</li>
            <li>Active goals appear as filters when viewing your collection</li>
            <li>Goals can be marked as inactive to hide them from collection filters</li>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)} variant="contained">
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
