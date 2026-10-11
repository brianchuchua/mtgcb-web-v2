import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetUserGoalsQuery } from '@/api/goals/goalsApi';
import { GetGoalsResponse } from '@/api/goals/types';
import { ApiResponse } from '@/api/types/apiTypes';
import { isCollectionPath } from '@/hooks/useIsCollectionContext';
import { forgetStoredGoal } from '@/hooks/useSearchStateSync';
import { clearSelectedGoal } from '@/redux/slices/browse';
import { RootState } from '@/redux/store';

const selectAnyGoalId = (state: RootState) =>
  state.browse.cardsSearchParams.selectedGoalId ?? state.browse.setsSearchParams.selectedGoalId ?? null;

/**
 * True when the goal list is complete and the selected goal isn't in it: the goal was deleted,
 * or it belongs to someone else. Inactive goals still count as known.
 */
export const isUnknownGoal = (
  goalId: number | null,
  goalsResponse: ApiResponse<GetGoalsResponse> | undefined,
): boolean => {
  if (goalId == null || !goalsResponse?.success || !goalsResponse.data) return false;
  const { goals, totalCount } = goalsResponse.data;
  if (goals.length < totalCount) return false;
  return !goals.some((goal) => goal.id === goalId);
};

/**
 * Goals only apply to a collection. Anywhere else (Browse) drop the selected goal so it
 * doesn't sit in the URL and hide form controls. A layout effect so the stored search
 * state is clean before useBrowseStateSync restores from it.
 */
export const useDropGoalOutsideCollection = () => {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const goalId = useSelector(selectAnyGoalId);

  useLayoutEffect(() => {
    if (!pathname || isCollectionPath(pathname)) return;
    forgetStoredGoal();
    if (goalId != null) dispatch(clearSelectedGoal());
  }, [pathname, goalId, dispatch]);
};

// Same arguments as GoalSelector so the request and cache are shared
const useOwnerGoals = (userId: number | null, goalId: number | null) =>
  useGetUserGoalsQuery({ userId: userId ?? 0, includeProgress: false, limit: 500 }, { skip: !userId || goalId == null });

/**
 * On a collection page, drop a selected goal that the collection's owner doesn't have.
 */
export const useDropUnknownGoal = (userId: number | null) => {
  const dispatch = useDispatch();
  const goalId = useSelector(selectAnyGoalId);
  const { currentData, isFetching, fulfilledTimeStamp, refetch } = useOwnerGoals(userId, goalId);

  // When this goal was first seen, and whether the list has been refetched for it
  const seen = useRef({ goalId, at: Date.now(), refetched: false });
  if (seen.current.goalId !== goalId) seen.current = { goalId, at: Date.now(), refetched: false };

  useEffect(() => {
    // Wait out a refetch (e.g. right after a goal is created or deleted) rather than judge an old list
    if (isFetching || !isUnknownGoal(goalId, currentData)) return;
    // A cached list from before the goal was selected may predate a goal made in another tab.
    // Check once with a fresh list before dropping.
    if ((fulfilledTimeStamp ?? 0) < seen.current.at) {
      if (!seen.current.refetched) {
        seen.current.refetched = true;
        refetch();
      }
      return;
    }
    forgetStoredGoal(goalId!);
    dispatch(clearSelectedGoal());
  }, [goalId, currentData, isFetching, fulfilledTimeStamp, refetch, dispatch]);
};

/**
 * True while a selected goal hasn't been confirmed against the owner's goal list yet, so
 * searches can wait instead of asking for a goal that's about to be dropped. Never waits
 * when the list can't be loaded.
 */
export const useIsGoalUnconfirmed = (userId: number | null): boolean => {
  const goalId = useSelector(selectAnyGoalId);
  const { currentData, isError } = useOwnerGoals(userId, goalId);

  if (goalId == null || !userId || isError) return false;
  if (!currentData) return true;
  return isUnknownGoal(goalId, currentData);
};
