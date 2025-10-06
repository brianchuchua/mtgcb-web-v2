import { useEffect, useRef, useState } from 'react';

interface ScrollPerformanceMetrics {
  averageFPS: number;
  minFPS: number;
  scrollEvents: number;
  isScrolling: boolean;
}

/**
 * Hook to measure scroll performance in real-time
 */
export const useScrollPerformance = (enabled: boolean = true) => {
  const [metrics, setMetrics] = useState<ScrollPerformanceMetrics>({
    averageFPS: 60,
    minFPS: 60,
    scrollEvents: 0,
    isScrolling: false,
  });

  const frameTimesRef = useRef<number[]>([]);
  const scrollCountRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const measureFrame = (currentTime: number) => {
      if (isScrollingRef.current) {
        if (lastFrameTimeRef.current > 0) {
          const delta = currentTime - lastFrameTimeRef.current;
          const fps = 1000 / delta;
          frameTimesRef.current.push(fps);

          // Keep last 60 frames
          if (frameTimesRef.current.length > 60) {
            frameTimesRef.current.shift();
          }

          // Update metrics
          const avgFPS = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
          const minFPS = Math.min(...frameTimesRef.current);

          setMetrics({
            averageFPS: avgFPS,
            minFPS: minFPS,
            scrollEvents: scrollCountRef.current,
            isScrolling: true,
          });
        }

        lastFrameTimeRef.current = currentTime;
      }

      animationFrameRef.current = requestAnimationFrame(measureFrame);
    };

    const handleScroll = () => {
      scrollCountRef.current++;
      isScrollingRef.current = true;

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set timeout to detect scroll end
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        setMetrics((prev) => ({ ...prev, isScrolling: false }));

        // Log final stats to console
        if (frameTimesRef.current.length > 0) {
          const avgFPS = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
          const minFPS = Math.min(...frameTimesRef.current);

          console.group('🎯 Scroll Performance Report');
          console.log('Average FPS:', avgFPS.toFixed(2));
          console.log('Minimum FPS:', minFPS.toFixed(2));
          console.log('Total Scroll Events:', scrollCountRef.current);
          console.log('Frame Times:', frameTimesRef.current.map(f => f.toFixed(1)));
          console.groupEnd();
        }
      }, 150);
    };

    // Start frame measurement
    animationFrameRef.current = requestAnimationFrame(measureFrame);

    // Listen to scroll events
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enabled]);

  return metrics;
};
