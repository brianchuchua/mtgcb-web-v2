import { useLayoutEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'next/navigation';
import { setViewContentType, setSelectedGoalId } from '@/redux/slices/browse';

/**
 * Hook to synchronize URL parameters with Redux state on initial mount.
 * Uses useLayoutEffect to run synchronously before paint to avoid flicker.
 * 
 * @param options Configuration for which params to sync
 */
export function useInitialUrlSync(options?: {
  syncView?: boolean;
  syncGoalId?: boolean;
}) {
  const { syncView = true, syncGoalId = true } = options || {};
  const dispatch = useDispatch();
  const searchParams = useSearchParams();

  useLayoutEffect(() => {
    // Sync view content type
    if (syncView) {
      const contentType = searchParams?.get('contentType');
      if (contentType === 'cards' || contentType === 'sets') {
        dispatch(setViewContentType(contentType));
      }
    }

    // Sync goal ID
    if (syncGoalId) {
      const goalIdParam = searchParams?.get('goalId');
      if (goalIdParam) {
        const goalId = parseInt(goalIdParam);
        if (!isNaN(goalId)) {
          dispatch(setSelectedGoalId(goalId));
        }
      }
    }
  }, []); // Only run once on mount
}