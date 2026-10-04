import { useCallback, useEffect, useRef, useState } from 'react';

const RECYCLE_DURATION_MS = 5000;

export const useConfettiBurst = () => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [recycleConfetti, setRecycleConfetti] = useState(true);
  const recycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const celebrate = useCallback(() => {
    setShowConfetti(true);
    setRecycleConfetti(true);

    // Stop spawning new confetti after 5 seconds, but keep animation running
    if (recycleTimerRef.current) clearTimeout(recycleTimerRef.current);
    recycleTimerRef.current = setTimeout(() => {
      setRecycleConfetti(false);
      recycleTimerRef.current = null;
    }, RECYCLE_DURATION_MS);
  }, []);

  const handleConfettiComplete = useCallback(() => {
    // Called when all confetti has fallen off-screen
    setShowConfetti(false);
    setRecycleConfetti(true); // Reset for next time
  }, []);

  useEffect(() => {
    return () => {
      if (recycleTimerRef.current) clearTimeout(recycleTimerRef.current);
    };
  }, []);

  return { showConfetti, recycleConfetti, handleConfettiComplete, celebrate };
};

/**
 * Celebrates when the set on screen reaches 100% (or the goal's slice of it, when a goal is selected).
 *
 * - `resetKey` identifies what the percentage measures (set, goal, subset setting). When it
 *   changes, the next settled value is a fresh baseline rather than a comparison, so switching
 *   from a goal at 80% for this set to one at 100% is not a "completion".
 * - Values are only read once `isSettled`: while the query is paused (waiting for the goal to
 *   sync from the URL) or fetching, the percentage on hand may belong to the previous arguments,
 *   or not exist yet.
 */
export const useSetCompletionTrigger = ({
  resetKey,
  isSettled,
  percentageCollected,
  celebrate,
}: UseSetCompletionTriggerOptions) => {
  const baselineRef = useRef<{ resetKey: string; percentageCollected: number } | null>(null);

  useEffect(() => {
    if (!isSettled || percentageCollected === undefined) return;

    const baseline = baselineRef.current;
    baselineRef.current = { resetKey, percentageCollected };

    if (!baseline || baseline.resetKey !== resetKey) return;

    if (baseline.percentageCollected < 100 && percentageCollected === 100) {
      celebrate();
    }
  }, [resetKey, isSettled, percentageCollected, celebrate]);
};

interface UseSetCompletionTriggerOptions {
  resetKey: string;
  isSettled: boolean;
  percentageCollected: number | undefined;
  celebrate: () => void;
}

/**
 * Celebrates when the whole goal (not just the current page's slice of it) reaches 100%.
 *
 * Deliberately conservative, since a goal summary can arrive from several queries:
 * - The first summary seen for a goal is only a baseline, never a celebration (page load,
 *   switching goals, or landing on an already-complete goal).
 * - Summaries for a goal other than the selected one are ignored (stale data mid-switch).
 * - It only fires when the goal's card total is unchanged and the collected count went up,
 *   so editing the goal itself down to 100% does not count as completing it.
 */
export const useGoalCompletionTrigger = ({
  goalId,
  goalSummary,
  enabled,
  celebrate,
}: UseGoalCompletionTriggerOptions) => {
  const baselineRef = useRef<GoalProgressSnapshot | null>(null);

  const summaryGoalId = goalSummary?.goalId;
  const percentageCollected = goalSummary?.percentageCollected;
  const collectedCards = goalSummary?.collectedCards;
  const totalCards = goalSummary?.totalCards;

  useEffect(() => {
    if (!enabled || !goalId) {
      baselineRef.current = null;
      return;
    }

    if (
      summaryGoalId !== goalId ||
      percentageCollected === undefined ||
      collectedCards === undefined ||
      totalCards === undefined
    ) {
      return;
    }

    const current: GoalProgressSnapshot = { goalId, percentageCollected, collectedCards, totalCards };
    const baseline = baselineRef.current;
    baselineRef.current = current;

    if (!baseline || baseline.goalId !== goalId) return;

    if (
      baseline.percentageCollected < 100 &&
      percentageCollected === 100 &&
      totalCards === baseline.totalCards &&
      collectedCards > baseline.collectedCards
    ) {
      celebrate();
    }
  }, [enabled, goalId, summaryGoalId, percentageCollected, collectedCards, totalCards, celebrate]);
};

interface GoalProgressSnapshot {
  goalId: number;
  percentageCollected: number;
  collectedCards: number;
  totalCards: number;
}

interface UseGoalCompletionTriggerOptions {
  goalId: number | null | undefined;
  goalSummary:
    | {
        goalId: number;
        percentageCollected: number;
        collectedCards: number;
        totalCards: number;
      }
    | null
    | undefined;
  enabled: boolean;
  celebrate: () => void;
}
