import { useCallback, useEffect, useRef, useState } from 'react';

export const useConfetti = (isFetching: boolean, percentageCollected: number) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [recycleConfetti, setRecycleConfetti] = useState(true);
  const previousPercentageRef = useRef<number | null>(null);
  const hasInitializedRef = useRef(false);

  const handleConfettiComplete = useCallback(() => {
    // Called when all confetti has fallen off-screen
    setShowConfetti(false);
    setRecycleConfetti(true); // Reset for next time
  }, []);

  useEffect(() => {
    // Wait for data to be fetched before initializing
    if (!isFetching && percentageCollected !== undefined && !hasInitializedRef.current) {
      previousPercentageRef.current = percentageCollected;
      hasInitializedRef.current = true;
      return;
    }

    // Only trigger confetti if:
    // 1. We have initialized (not first load)
    // 2. Previous percentage was less than 100
    // 3. Current percentage is 100
    // 4. We're not currently fetching
    if (
      hasInitializedRef.current &&
      !isFetching &&
      previousPercentageRef.current !== null &&
      previousPercentageRef.current < 100 &&
      percentageCollected === 100
    ) {
      setShowConfetti(true);
      setRecycleConfetti(true);
      
      // Stop spawning new confetti after 5 seconds, but keep animation running
      const timer = setTimeout(() => {
        setRecycleConfetti(false);
      }, 5000);

      previousPercentageRef.current = percentageCollected;
      return () => clearTimeout(timer);
    }

    // Update previous percentage when it changes
    if (!isFetching && percentageCollected !== undefined) {
      previousPercentageRef.current = percentageCollected;
    }
  }, [isFetching, percentageCollected]);

  return { showConfetti, recycleConfetti, handleConfettiComplete };
};