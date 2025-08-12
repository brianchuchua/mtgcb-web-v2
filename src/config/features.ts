/**
 * Feature flags configuration
 *
 * This file contains boolean flags to enable/disable various features
 * throughout the application. This makes it easy to toggle features
 * for testing or performance reasons.
 */

export const featureFlags = {
  /**
   * Controls whether to prefetch the next page of results
   * Set to false to disable prefetching for performance testing
   * or to reduce API calls.
   *
   * When enabled:
   * - The next page of results is fetched 1 second after the current page loads
   * - Results are cached for 300ms to prevent redundant requests
   * - Improves perceived performance when navigating between pages
   *
   * When disabled:
   * - Pages are only fetched when explicitly requested
   * - Reduces unnecessary API calls
   * - May result in slightly slower page transitions
   *
   * To enable: Change this value to true
   */
  enablePrefetchNextPage: true,
} as const;
