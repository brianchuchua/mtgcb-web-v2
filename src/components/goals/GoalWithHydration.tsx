import { useEffect, useState } from 'react';
import { useGetGoalQuery } from '@/api/goals/goalsApi';
import { Goal } from '@/api/goals/types';

interface GoalWithHydrationProps {
  goal: Goal;
  userId: number;
  priceType: string;
  delay: number;
  onHydrated: (goal: Goal) => void;
}

export function GoalWithHydration({ goal, userId, priceType, delay, onHydrated }: GoalWithHydrationProps) {
  const [shouldFetch, setShouldFetch] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldFetch(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const { data, isSuccess } = useGetGoalQuery(
    {
      userId,
      goalId: goal.id,
      includeProgress: true,
      priceType,
    },
    {
      skip: !shouldFetch,
    }
  );

  useEffect(() => {
    if (isSuccess && data?.success && data?.data) {
      onHydrated(data.data);
    }
  }, [isSuccess, data, onHydrated]);

  return null;
}