/**
 * Performance monitoring utilities for diagnosing rendering issues
 */

export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private frameId: number | null = null;
  private lastFrameTime: number = 0;
  private fps: number[] = [];

  /**
   * Start monitoring FPS
   */
  startFPSMonitoring() {
    const measureFrame = (currentTime: number) => {
      if (this.lastFrameTime > 0) {
        const delta = currentTime - this.lastFrameTime;
        const currentFPS = 1000 / delta;
        this.fps.push(currentFPS);

        // Keep only last 60 frames
        if (this.fps.length > 60) {
          this.fps.shift();
        }
      }

      this.lastFrameTime = currentTime;
      this.frameId = requestAnimationFrame(measureFrame);
    };

    this.frameId = requestAnimationFrame(measureFrame);
  }

  /**
   * Stop monitoring FPS
   */
  stopFPSMonitoring() {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  /**
   * Get current FPS stats
   */
  getFPSStats() {
    if (this.fps.length === 0) {
      return { avg: 0, min: 0, max: 0 };
    }

    const avg = this.fps.reduce((a, b) => a + b, 0) / this.fps.length;
    const min = Math.min(...this.fps);
    const max = Math.max(...this.fps);

    return { avg, min, max };
  }

  /**
   * Measure component render time
   */
  measureRender(componentName: string, fn: () => void) {
    const start = performance.now();
    fn();
    const end = performance.now();
    const duration = end - start;

    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, []);
    }

    this.metrics.get(componentName)!.push(duration);

    // Keep only last 100 measurements
    const measurements = this.metrics.get(componentName)!;
    if (measurements.length > 100) {
      measurements.shift();
    }
  }

  /**
   * Get render time stats for a component
   */
  getRenderStats(componentName: string) {
    const measurements = this.metrics.get(componentName);
    if (!measurements || measurements.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }

    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);

    return { avg, min, max, count: measurements.length };
  }

  /**
   * Log all stats to console
   */
  logStats() {
    console.group('🔍 Performance Monitor Stats');

    const fpsStats = this.getFPSStats();
    console.log('📊 FPS:', {
      average: fpsStats.avg.toFixed(2),
      min: fpsStats.min.toFixed(2),
      max: fpsStats.max.toFixed(2),
    });

    console.log('\n⏱️ Render Times (ms):');
    this.metrics.forEach((_, componentName) => {
      const stats = this.getRenderStats(componentName);
      console.log(`  ${componentName}:`, {
        avg: stats.avg.toFixed(2),
        min: stats.min.toFixed(2),
        max: stats.max.toFixed(2),
        samples: stats.count,
      });
    });

    console.groupEnd();
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
    this.fps = [];
    this.lastFrameTime = 0;
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

// Browser DevTools helpers
if (typeof window !== 'undefined') {
  (window as any).__perfMonitor = perfMonitor;
  console.log('💡 Performance monitor available at window.__perfMonitor');
}
