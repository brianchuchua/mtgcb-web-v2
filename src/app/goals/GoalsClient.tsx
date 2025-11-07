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
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGetUserGoalsQuery } from '@/api/goals/goalsApi';
import { Goal } from '@/api/goals/types';
import { GoalWithHydration } from '@/components/goals/GoalWithHydration';
import { GoalsList } from '@/components/goals/GoalsList';
import Pagination, { PaginationProps } from '@/components/pagination/Pagination';
import { usePriceType } from '@/contexts/DisplaySettingsContext';
import { useGoalsPagination } from '@/hooks/goals/useGoalsPagination';
import { useAuth } from '@/hooks/useAuth';
import { goalsCache } from '@/utils/goalsCache';

export function GoalsClient() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [displayPriceType] = usePriceType();
  const { currentPage, pageSize, onPageChange, onPageSizeChange } = useGoalsPagination();
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [hydratedGoals, setHydratedGoals] = useState<Map<number, Goal>>(new Map());
  const [currentlyHydratingIndex, setCurrentlyHydratingIndex] = useState<number>(0);
  const [delayMap, setDelayMap] = useState<Map<number, number>>(new Map());
  const [priorityOrder, setPriorityOrder] = useState<number[]>([]);
  const [initialGoalIds, setInitialGoalIds] = useState<string>('');
  const [hydrationSessionKey, setHydrationSessionKey] = useState<number>(0);
  const initializedRef = useRef(false);

  // Always fetch all goals without progress data (lightweight query)
  const listQueryArgs = {
    userId: user?.userId ?? 0,
    includeProgress: false,
    priceType: displayPriceType.toLowerCase(),
    limit: 500, // Get all goals for pagination
    offset: 0,
  };

  const {
    data: listData,
    isLoading: isListLoading,
    error: listError,
  } = useGetUserGoalsQuery(listQueryArgs, {
    skip: !user?.userId,
  });

  // Server list is source of truth - hydrate each goal from cache if available
  const serverGoals = listData?.data?.goals || [];
  const allGoals = serverGoals.map((serverGoal) => {
    // First check if we have a hydrated version (from the staggered fetch)
    const hydrated = hydratedGoals.get(serverGoal.id);
    if (hydrated) {
      return hydrated;
    }

    // Otherwise check if we have a cached version with progress
    if (user?.userId) {
      const cached = goalsCache.getGoal(user.userId, serverGoal.id);
      if (cached && cached.progress) {
        return cached;
      }
    }

    // Fall back to server version (no progress data)
    return serverGoal;
  });

  const totalCount = allGoals.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Calculate which goals should be visible on current page
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const visibleGoals = allGoals.slice(startIndex, endIndex);

  // Calculate initial priority order and delays ONCE when the page or goal IDs change
  // IMPORTANT: We only recalculate when goal IDs change, NOT when progress changes!
  useEffect(() => {
    const currentGoalIds = visibleGoals.map((g) => g.id).join(',');

    // Only recalculate if the set of goal IDs has changed (page change or list change)
    // Use ref to prevent infinite loop with empty goal lists
    if (initializedRef.current && currentGoalIds === initialGoalIds) {
      return;
    }

    // Determine hydration priority: goals without progress first, then goals with cached progress
    // This ensures users see new data for uncached goals ASAP rather than waiting for refreshes
    const goalsWithoutProgress: Goal[] = [];
    const goalsWithProgress: Goal[] = [];

    visibleGoals.forEach((goal) => {
      if (goal.progress) {
        goalsWithProgress.push(goal);
      } else {
        goalsWithoutProgress.push(goal);
      }
    });

    // Priority order: uncached goals hydrate first
    const newPriorityOrder = [...goalsWithoutProgress, ...goalsWithProgress];

    // Create delay map based on priority order (not display order)
    const newDelayMap = new Map<number, number>();
    newPriorityOrder.forEach((goal, index) => {
      const delay = index * 2000;
      newDelayMap.set(goal.id, delay);
    });

    setDelayMap(newDelayMap);
    setPriorityOrder(newPriorityOrder.map((g) => g.id));
    setInitialGoalIds(currentGoalIds);
    setCurrentlyHydratingIndex(0);
    setHydrationSessionKey((prev) => prev + 1); // Force remount of all GoalWithHydration components
    initializedRef.current = true; // Mark as initialized
  }, [currentPage, visibleGoals, initialGoalIds]);

  // Handle hydration callback
  const handleGoalHydrated = useCallback(
    (goal: Goal) => {
      setHydratedGoals((prev) => {
        const newMap = new Map(prev);
        newMap.set(goal.id, goal);
        return newMap;
      });

      // Move to next goal in the list
      setCurrentlyHydratingIndex((prev) => prev + 1);

      // Update cache with hydrated goal
      if (user?.userId) {
        goalsCache.updateGoal(user.userId, goal);
      }
    },
    [user?.userId],
  );

  // Start with visible goals, then replace with hydrated versions as they come in
  const goals = visibleGoals.map((goal) => {
    const hydratedVersion = hydratedGoals.get(goal.id);
    return hydratedVersion || goal;
  });
  const isLoading = isListLoading;
  const error = listError;

  // Determine which goal is currently hydrating based on PRIORITY order, not display order
  const currentlyHydratingGoalId =
    currentlyHydratingIndex < priorityOrder.length ? priorityOrder[currentlyHydratingIndex] : null;

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
            <GoalsList goals={goals} userId={user?.userId || 0} hydratingGoalId={currentlyHydratingGoalId} />
            {/* Render hydration components for visible goals with priority-based delays */}
            {visibleGoals.map((goal) => (
              <GoalWithHydration
                key={`${goal.id}-${currentPage}-${hydrationSessionKey}`}
                goal={goal}
                userId={user?.userId || 0}
                priceType={displayPriceType.toLowerCase()}
                delay={delayMap.get(goal.id) || 0}
                onHydrated={handleGoalHydrated}
              />
            ))}
          </Box>
          <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 4 }}>
            <Pagination {...paginationProps} position="bottom" />
          </Box>
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
            "collect every red goblin" or "collect every legendary creature less expensive than $10".
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
