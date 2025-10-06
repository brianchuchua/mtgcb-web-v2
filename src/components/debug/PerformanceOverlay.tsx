import { Box, Paper, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  fps: number;
  minFPS: number;
  maxFPS: number;
  avgFPS: number;
  scrollEvents: number;
  renderTime: number;
  isScrolling: boolean;
}

/**
 * Development-only performance overlay to measure scroll and render performance
 * Shows FPS, scroll events, and render times in real-time
 */
export const PerformanceOverlay = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    minFPS: 60,
    maxFPS: 60,
    avgFPS: 60,
    scrollEvents: 0,
    renderTime: 0,
    isScrolling: false,
  });

  const frameTimesRef = useRef<number[]>([]);
  const scrollCountRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    let updateIntervalId: NodeJS.Timeout | null = null;

    // Measure frame rate
    const measureFrame = (currentTime: number) => {
      if (lastFrameTimeRef.current > 0) {
        const delta = currentTime - lastFrameTimeRef.current;
        const fps = 1000 / delta;

        frameTimesRef.current.push(fps);

        // Keep last 120 frames (2 seconds at 60fps)
        if (frameTimesRef.current.length > 120) {
          frameTimesRef.current.shift();
        }
      }

      lastFrameTimeRef.current = currentTime;
      animationFrameRef.current = requestAnimationFrame(measureFrame);
    };

    // Update metrics periodically instead of every frame
    updateIntervalId = setInterval(() => {
      if (frameTimesRef.current.length > 0) {
        const avgFPS = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
        const minFPS = Math.min(...frameTimesRef.current);
        const maxFPS = Math.max(...frameTimesRef.current);
        const currentFPS = frameTimesRef.current[frameTimesRef.current.length - 1] || 60;

        setMetrics(prev => ({
          ...prev,
          fps: currentFPS,
          avgFPS: avgFPS,
          minFPS: minFPS,
          maxFPS: maxFPS,
        }));
      }
    }, 100); // Update display every 100ms

    // Handle scroll events
    const handleScroll = () => {
      scrollCountRef.current++;
      isScrollingRef.current = true;

      // Update scroll state immediately (throttled by interval above)
      if (!isScrollingRef.current) {
        setMetrics(prev => ({
          ...prev,
          scrollEvents: scrollCountRef.current,
          isScrolling: true,
        }));
      }

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set timeout to detect scroll end
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        setMetrics(prev => ({ ...prev, isScrolling: false, scrollEvents: scrollCountRef.current }));

        // Log summary to console
        if (frameTimesRef.current.length > 0) {
          const avgFPS = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
          const minFPS = Math.min(...frameTimesRef.current);
          const maxFPS = Math.max(...frameTimesRef.current);
          const below30Count = frameTimesRef.current.filter(f => f < 30).length;
          const below60Count = frameTimesRef.current.filter(f => f < 60).length;

          console.group('📊 Scroll Performance Summary');
          console.log('Average FPS:', avgFPS.toFixed(2));
          console.log('Min FPS:', minFPS.toFixed(2));
          console.log('Max FPS:', maxFPS.toFixed(2));
          console.log('Frames below 60fps:', below60Count, `(${((below60Count / frameTimesRef.current.length) * 100).toFixed(1)}%)`);
          console.log('Frames below 30fps:', below30Count, `(${((below30Count / frameTimesRef.current.length) * 100).toFixed(1)}%)`);
          console.log('Total scroll events:', scrollCountRef.current);
          console.groupEnd();

          // Warn if performance is poor
          if (avgFPS < 50) {
            console.warn('⚠️ Poor scroll performance detected! Average FPS:', avgFPS.toFixed(2));
          }
        }

        // Reset counters
        frameTimesRef.current = [];
        scrollCountRef.current = 0;
        setMetrics(prev => ({ ...prev, scrollEvents: 0 }));
      }, 200);
    };

    // Measure render time
    renderStartRef.current = performance.now();

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
      if (updateIntervalId) {
        clearInterval(updateIntervalId);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Calculate render time - but don't update on every render to avoid loop
  // Just track it, the interval will pick it up
  useEffect(() => {
    const renderTime = performance.now() - renderStartRef.current;
    // Store in ref instead of state to avoid re-render loop
    if (renderTime > 0) {
      // Only update if significantly different to reduce re-renders
      setMetrics(prev => {
        if (Math.abs(prev.renderTime - renderTime) > 0.5) {
          return { ...prev, renderTime };
        }
        return prev;
      });
    }
    renderStartRef.current = performance.now();
  });

  // Determine color based on FPS
  const getFPSColor = (fps: number) => {
    if (fps >= 55) return '#4caf50'; // Green
    if (fps >= 30) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        top: 80,
        right: 16,
        zIndex: 10000,
        padding: 2,
        minWidth: 200,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '12px',
        borderLeft: metrics.isScrolling ? '4px solid #2196f3' : '4px solid transparent',
        transition: 'border-left 0.1s',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#2196f3' }}>
        Performance Monitor
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption">Current FPS:</Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 'bold',
              color: getFPSColor(metrics.fps)
            }}
          >
            {metrics.fps.toFixed(1)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption">Avg FPS:</Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 'bold',
              color: getFPSColor(metrics.avgFPS)
            }}
          >
            {metrics.avgFPS.toFixed(1)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption">Min FPS:</Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 'bold',
              color: getFPSColor(metrics.minFPS)
            }}
          >
            {metrics.minFPS.toFixed(1)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption">Max FPS:</Typography>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            {metrics.maxFPS.toFixed(1)}
          </Typography>
        </Box>

        <Box sx={{ height: '1px', backgroundColor: '#444', my: 1 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption">Scroll Events:</Typography>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            {metrics.scrollEvents}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption">Render Time:</Typography>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            {metrics.renderTime.toFixed(2)}ms
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption">Status:</Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 'bold',
              color: metrics.isScrolling ? '#2196f3' : '#666'
            }}
          >
            {metrics.isScrolling ? 'SCROLLING' : 'IDLE'}
          </Typography>
        </Box>
      </Box>

      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 1,
          pt: 1,
          borderTop: '1px solid #444',
          color: '#999',
          fontSize: '10px'
        }}
      >
        Check console for detailed stats after scrolling
      </Typography>
    </Paper>
  );
};
